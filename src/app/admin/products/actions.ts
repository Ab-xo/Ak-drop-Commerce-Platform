'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().max(80).optional(),
  description: z.string().trim().min(10).max(10000),
  shortDescription: z.string().trim().max(500).optional(),
  price: z.coerce.number().finite().nonnegative(),
  comparePrice: z.union([z.coerce.number().finite().nonnegative(), z.literal('')]).optional(),
  quantity: z.coerce.number().int().nonnegative().max(1000000),
  categoryId: z.string().uuid(),
  images: z.array(z.string().trim().min(1).max(2000)).length(4),
});

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const maxImageBytes = 6 * 1024 * 1024;

function isImageContentValid(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
  if (type === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  if (type === 'image/avif') {
    return String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp'
      && ['avif', 'avis'].includes(String.fromCharCode(...bytes.slice(8, 12)));
  }
  return false;
}

function isValidGalleryUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export async function uploadProductImage(file: File, slug: string) {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) return { error: 'Admin access is required to upload product images.' };

  if (!file || file.size === 0 || file.size > maxImageBytes || !allowedImageTypes.has(file.type)) {
    return { error: 'Choose a JPEG, PNG, WebP, or AVIF image up to 6 MB.' };
  }

  const safeSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(slug);
  if (!safeSlug.success) return { error: 'Enter a valid product slug before uploading images.' };

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isImageContentValid(file.type, bytes)) {
    return { error: 'The selected file content does not match its image type.' };
  }

  const extensionByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  const objectPath = `${safeSlug.data}/${crypto.randomUUID()}.${extensionByType[file.type]}`;
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from('product-images')
    .upload(objectPath, bytes, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    console.error('Admin product image upload failed:', error.message);
    return { error: 'Image upload failed. Check the product image storage setup and try again.' };
  }

  const { data } = admin.storage.from('product-images').getPublicUrl(objectPath);
  return { url: data.publicUrl };
}

export async function saveProduct(formData: FormData) {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) return { error: 'Admin access is required to save products.' };

  const images = Array.from({ length: 4 }, (_, index) => String(formData.get(`image-${index + 1}`) ?? ''));
  const parsed = productSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    name: formData.get('name'),
    slug: formData.get('slug'),
    sku: formData.get('sku'),
    description: formData.get('description'),
    shortDescription: formData.get('shortDescription'),
    price: formData.get('price'),
    comparePrice: formData.get('comparePrice'),
    quantity: formData.get('quantity'),
    categoryId: formData.get('categoryId'),
    images,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Review the product details and try again.' };
  }
  if (new Set(parsed.data.images).size !== 4 || parsed.data.images.some((image) => !isValidGalleryUrl(image))) {
    return { error: 'Add four distinct public HTTPS or local product image URLs.' };
  }

  const admin = createAdminClient();
  const { data: category, error: categoryError } = await admin
    .from('categories')
    .select('id')
    .eq('id', parsed.data.categoryId)
    .eq('is_active', true)
    .maybeSingle();

  if (categoryError) {
    console.error('Admin product category lookup failed:', categoryError.message);
    return { error: 'Could not verify the selected category.' };
  }
  if (!category) return { error: 'Choose an active product category.' };

  const productValues = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    sku: parsed.data.sku?.trim() || null,
    description: parsed.data.description,
    short_description: parsed.data.shortDescription?.trim() || null,
    price: parsed.data.price,
    compare_price: parsed.data.comparePrice === '' ? null : parsed.data.comparePrice,
    track_quantity: true,
    quantity: parsed.data.quantity,
    category_id: parsed.data.categoryId,
    images: parsed.data.images,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const query = parsed.data.id
    ? admin.from('products').update(productValues).eq('id', parsed.data.id).select('id').single()
    : admin.from('products').insert(productValues).select('id').single();
  const { data: savedProduct, error } = await query;

  if (error) {
    console.error('Admin product save failed:', error.message);
    if (error.code === '23505') return { error: 'That product slug or SKU is already in use.' };
    return { error: 'Could not save this product. Check the values and try again.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  revalidatePath(`/shop/${savedProduct.id}`);
  return { success: true };
}
