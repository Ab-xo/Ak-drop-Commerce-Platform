import { notFound } from 'next/navigation';
import ProductManager from '@/components/admin/ProductManager';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export default async function AdminProductsPage() {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) notFound();

  const admin = createAdminClient();
  const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
    admin
      .from('products')
      .select('id, name, slug, sku, description, short_description, price, compare_price, quantity, category_id, images')
      .order('name'),
    admin
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name'),
  ]);

  if (productsError) {
    console.error('Admin product catalog load failed:', productsError.message);
    throw new Error('Unable to load the product catalog.');
  }
  if (categoriesError) {
    console.error('Admin category list load failed:', categoriesError.message);
    throw new Error('Unable to load product categories.');
  }

  const productRecords = (products ?? []).map((product) => ({
    ...product,
    price: Number(product.price),
    compare_price: product.compare_price == null ? null : Number(product.compare_price),
    quantity: Number(product.quantity ?? 0),
    images: Array.isArray(product.images)
      ? [...new Set(product.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0))]
      : [],
  }));

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="products">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Store management</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Product catalog</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage product details, inventory, and four-image galleries.</p>
        </div>
      </div>
        <ProductManager
          products={productRecords}
          categories={(categories ?? []).map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          }))}
        />
    </AdminWorkspace>
  );
}
