'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, PackagePlus, Save, Search, ShieldCheck, Upload, X } from 'lucide-react';
import { saveProduct, uploadProductImage } from '@/app/admin/products/actions';

type CategoryOption = { id: string; name: string; slug: string };
type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  quantity: number;
  category_id: string | null;
  images: string[];
};

type ProductFields = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: string;
  comparePrice: string;
  quantity: string;
  categoryId: string;
  images: string[];
};

function fieldsFor(product: ProductRecord | null, categories: CategoryOption[]): ProductFields {
  return {
    id: product?.id ?? '',
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    sku: product?.sku ?? '',
    description: product?.description ?? '',
    shortDescription: product?.short_description ?? '',
    price: product ? String(product.price) : '',
    comparePrice: product?.compare_price == null ? '' : String(product.compare_price),
    quantity: product ? String(product.quantity) : '0',
    categoryId: product?.category_id ?? categories[0]?.id ?? '',
    images: Array.from({ length: 4 }, (_, index) => product?.images[index] ?? ''),
  };
}

export default function ProductManager({
  products: initialProducts,
  categories,
}: {
  products: ProductRecord[];
  categories: CategoryOption[];
}) {
  const products = initialProducts;
  const [fields, setFields] = useState(() => fieldsFor(null, categories));
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...products]
      .filter((product) => !term || `${product.name} ${product.sku ?? ''} ${product.slug}`.toLowerCase().includes(term))
      .sort((left, right) => {
        const leftMissing = (left.images?.filter(Boolean).length ?? 0) < 4;
        const rightMissing = (right.images?.filter(Boolean).length ?? 0) < 4;
        return Number(rightMissing) - Number(leftMissing) || left.name.localeCompare(right.name);
      });
  }, [products, search]);

  function selectProduct(product: ProductRecord | null) {
    setFields(fieldsFor(product, categories));
    setFeedback(null);
  }

  function updateField<K extends keyof ProductFields>(key: K, value: ProductFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.images.length) return;
    const images = [...fields.images];
    [images[index], images[target]] = [images[target], images[index]];
    updateField('images', images);
  }

  async function uploadImage(index: number, file: File | undefined) {
    if (!file) return;
    if (!fields.slug.trim()) {
      setFeedback({ kind: 'error', text: 'Enter the product slug before uploading images.' });
      return;
    }

    setUploadingSlot(index);
    setFeedback(null);
    try {
      const result = await uploadProductImage(file, fields.slug.trim());
      if (result.error) {
        setFeedback({ kind: 'error', text: result.error });
        return;
      }
      if (!result.url) {
        setFeedback({ kind: 'error', text: 'Image upload did not return a public URL.' });
        return;
      }
      const images = [...fields.images];
      images[index] = result.url;
      updateField('images', images);
      setFeedback({ kind: 'success', text: `Image ${index + 1} uploaded. Save the product to publish the gallery.` });
    } catch (error) {
      console.error('Product image upload request failed:', error);
      setFeedback({ kind: 'error', text: 'Image upload failed. Please try again.' });
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const formData = new FormData(event.currentTarget);
      const result = await saveProduct(formData);
      if (result.error) {
        setFeedback({ kind: 'error', text: result.error });
        return;
      }

      setFeedback({ kind: 'success', text: 'Product saved with its four-image gallery.' });
      window.location.reload();
    } catch (error) {
      console.error('Product save request failed:', error);
      setFeedback({ kind: 'error', text: 'Could not save the product. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(16rem,0.82fr)_minmax(0,1.65fr)]">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <header className="border-b border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Catalog</h2>
              <p className="mt-1 text-xs text-muted-foreground">{products.length} products · incomplete galleries first</p>
            </div>
            <button
              type="button"
              onClick={() => selectProduct(null)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
            >
              <PackagePlus size={15} /> New
            </button>
          </div>
          <label className="relative mt-4 block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </header>
        <div className="max-h-[70vh] divide-y divide-border overflow-y-auto">
          {visibleProducts.map((product) => {
            const imageCount = product.images?.filter(Boolean).length ?? 0;
            const selected = fields.id === product.id;
            return (
              <button
                type="button"
                key={product.id}
                onClick={() => selectProduct(product)}
                className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-secondary/40 ${selected ? 'bg-primary/[0.07]' : ''}`}
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/50">
                  {product.images?.[0] && <Image src={product.images[0]} alt="" fill sizes="48px" unoptimized className="object-cover" />}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{product.name}</span>
                  <span className="mt-1 block truncate text-[11px] text-muted-foreground">{product.sku || product.slug}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${imageCount === 4 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                  {imageCount}/4
                </span>
              </button>
            );
          })}
          {!visibleProducts.length && <p className="p-6 text-center text-sm text-muted-foreground">No products match that search.</p>}
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-5">
        <input type="hidden" name="id" value={fields.id} />
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{fields.id ? 'Edit product' : 'New catalog item'}</p>
              <h2 className="mt-1 text-xl font-black">{fields.name || 'Product details'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Manage catalog details and its complete image gallery.</p>
            </div>
            {fields.id && (
              <button type="button" onClick={() => selectProduct(null)} className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Create a new product">
                <X size={18} />
              </button>
            )}
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
              Product name *
              <input required name="name" minLength={2} maxLength={160} value={fields.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="space-y-1.5 text-sm font-semibold">
              URL slug *
              <input required name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={fields.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="urban-commuter-backpack" className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="space-y-1.5 text-sm font-semibold">
              SKU
              <input name="sku" maxLength={80} value={fields.sku} onChange={(event) => updateField('sku', event.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="space-y-1.5 text-sm font-semibold">
              Price (ETB) *
              <input required name="price" type="number" min="0" step="0.01" value={fields.price} onChange={(event) => updateField('price', event.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="space-y-1.5 text-sm font-semibold">
              Compare-at price (ETB)
              <input name="comparePrice" type="number" min="0" step="0.01" value={fields.comparePrice} onChange={(event) => updateField('comparePrice', event.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="space-y-1.5 text-sm font-semibold">
              Stock quantity *
              <input required name="quantity" type="number" min="0" step="1" value={fields.quantity} onChange={(event) => updateField('quantity', event.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="space-y-1.5 text-sm font-semibold">
              Category *
              <select required name="categoryId" value={fields.categoryId} onChange={(event) => updateField('categoryId', event.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
              Short description
              <input name="shortDescription" maxLength={500} value={fields.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
              Description *
              <textarea required name="description" minLength={10} maxLength={10000} rows={4} value={fields.description} onChange={(event) => updateField('description', event.target.value)} className="w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 font-normal leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">Product gallery</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Add four distinct product photos. The first is the main image used on product cards. Use genuine views of this exact item.</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${fields.images.filter(Boolean).length === 4 && new Set(fields.images).size === 4 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
              {new Set(fields.images.filter(Boolean)).size}/4 ready
            </span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.images.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-border bg-background">
                <div className="relative aspect-[4/3] bg-secondary/30">
                  {image ? (
                    <Image src={image} alt={`Product gallery image ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 40vw" unoptimized className="object-contain p-2" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/70">
                      <ImagePlus size={24} />
                      <span className="text-xs font-semibold">Add gallery image {index + 1}</span>
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full border border-border/70 bg-background/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                    {index === 0 ? 'Main image' : `View ${index + 1}`}
                  </span>
                </div>
                <div className="space-y-2 border-t border-border p-3">
                  <input
                    type="text"
                    name={`image-${index + 1}`}
                    aria-label={`Image URL ${index + 1}`}
                    required
                    value={image}
                    maxLength={2000}
                    onChange={(event) => {
                      const nextImages = [...fields.images];
                      nextImages[index] = event.target.value;
                      updateField('images', nextImages);
                    }}
                    placeholder="https://… or /s-products/…"
                    className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-semibold transition hover:border-primary/40 hover:text-primary">
                      {uploadingSlot === index ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        disabled={uploadingSlot !== null}
                        onChange={(event) => {
                          void uploadImage(index, event.target.files?.[0]);
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <div className="flex gap-1">
                      <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="rounded-lg border border-border p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-30" aria-label={`Move image ${index + 1} left`}>
                        <ArrowUp size={15} />
                      </button>
                      <button type="button" disabled={index === 3} onClick={() => moveImage(index, 1)} className="rounded-lg border border-border p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-30" aria-label={`Move image ${index + 1} right`}>
                        <ArrowDown size={15} />
                      </button>
                      <button type="button" disabled={!image} onClick={() => {
                        const nextImages = [...fields.images];
                        nextImages[index] = '';
                        updateField('images', nextImages);
                      }} className="rounded-lg border border-border p-2 text-muted-foreground transition hover:text-destructive disabled:opacity-30" aria-label={`Remove image ${index + 1}`}>
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {feedback && (
          <p role={feedback.kind === 'error' ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 text-sm ${feedback.kind === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
            {feedback.text}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:mr-auto"><ShieldCheck size={14} />Admin-only catalog changes</span>
          <button type="submit" disabled={isSaving || uploadingSlot !== null || categories.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            {isSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
            {isSaving ? 'Saving…' : fields.id ? 'Save product' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}
