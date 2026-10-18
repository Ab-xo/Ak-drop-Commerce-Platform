import { createClient } from "@/lib/supabase";
import type { Category, Product, ProductVariant } from "@/types";

function normalizeProduct(row: Record<string, unknown>): Product {
  const images = Array.isArray(row.images)
    ? row.images.filter((image): image is string => typeof image === "string")
    : [];
  const features = Array.isArray(row.features)
    ? row.features.filter((feature): feature is string => typeof feature === "string")
    : Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
  if (row.product_variants != null && !Array.isArray(row.product_variants)) {
    throw new Error("Product option data is malformed.");
  }
  const productPrice = Number(row.price);
  if (row.price == null || !Number.isFinite(productPrice) || productPrice < 0) {
    throw new Error("Product price data is invalid.");
  }
  const variants = (Array.isArray(row.product_variants) ? row.product_variants : [])
    .map((candidate): ProductVariant | null => {
      if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
        throw new Error("Product option data is malformed.");
      }
      const variant = candidate as Record<string, unknown>;
      if (variant.is_active !== true) return null;
      const priceAdjustment = Number(variant.price_adjustment ?? 0);
      const priceOverride = variant.price_override == null ? null : Number(variant.price_override);
      const stockQuantity = Number(variant.stock_quantity ?? 0);
      const rawAttributes = variant.attributes;
      if (
        typeof variant.id !== "string" ||
        typeof variant.product_id !== "string" ||
        variant.product_id !== row.id ||
        !Number.isFinite(priceAdjustment) ||
        (priceOverride !== null && (!Number.isFinite(priceOverride) || priceOverride < 0)) ||
        !Number.isSafeInteger(stockQuantity) ||
        stockQuantity < 0 ||
        (rawAttributes != null && (typeof rawAttributes !== "object" || Array.isArray(rawAttributes)))
      ) {
        throw new Error("An active product option contains invalid price, stock, or identifier data.");
      }
      const attributeEntries = Object.entries(rawAttributes ?? {});
      if (attributeEntries.some(([, value]) => !["string", "number", "boolean"].includes(typeof value))) {
        throw new Error("A product option has invalid attribute data.");
      }
      const attributes = Object.fromEntries(
        attributeEntries.map(([name, value]) => [name, String(value)])
      );
      const price = priceOverride ?? productPrice + priceAdjustment;
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("An active product option has an invalid price.");
      }
      return {
        id: variant.id,
        product_id: variant.product_id,
        sku: typeof variant.sku === "string" ? variant.sku : null,
        size: typeof variant.size === "string" ? variant.size : null,
        color: typeof variant.color === "string" ? variant.color : null,
        attributes,
        price_adjustment: priceAdjustment,
        price_override: priceOverride,
        stock_quantity: stockQuantity,
        is_active: true,
        image_url: typeof variant.image_url === "string" ? variant.image_url : null,
      };
    })
    .filter((variant): variant is ProductVariant => variant !== null);
  const baseStock = Number(row.quantity ?? row.stock ?? 0);
  if (!Number.isSafeInteger(baseStock) || baseStock < 0) {
    throw new Error("Product inventory data is invalid.");
  }
  const comparePrice = row.compare_price == null ? null : Number(row.compare_price);
  if (comparePrice !== null && (!Number.isFinite(comparePrice) || comparePrice < 0)) {
    throw new Error("Product comparison price data is invalid.");
  }
  return {
    ...row,
    price: productPrice,
    track_quantity: row.track_quantity !== false,
    stock: variants.length
      ? variants.reduce((total, variant) => total + variant.stock_quantity, 0)
      : baseStock,
    main_image: typeof row.main_image === "string" ? row.main_image : images[0] || "",
    images,
    compare_price: comparePrice,
    features,
    variants,
    category: row.categories || undefined,
  } as Product;
}

const productSelection = "*, categories(id, name, slug), product_variants(id, product_id, sku, size, color, attributes, price_adjustment, price_override, stock_quantity, is_active, image_url)";

export async function getProducts(categorySlug?: string, featuredOnly?: boolean, limit?: number) {
  const supabase = createClient();

  // If filtering by a specific category, resolve its ID first to avoid
  // broken PostgREST embedded-filter syntax with !inner joins.
  let categoryId: string | null = null;
  if (categorySlug && categorySlug !== "all") {
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (catError) throw catError;
    if (!catData) return [];
    categoryId = catData.id;
  }

  // Use a left join (no !inner) so products without a category are not dropped.
  let query = supabase
    .from("products")
    .select(productSelection)
    .eq("is_active", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (featuredOnly) query = query.eq("is_featured", true);
  if (limit) query = query.limit(limit);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`, { cause: error });
  }
  return (data ?? []).map(normalizeProduct);
}

export async function getNewArrivals(limit = 4) {
  const { data, error } = await createClient()
    .from("products")
    .select(productSelection)
    .eq("is_active", true)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch new arrivals: ${error.message}`, { cause: error });
  }
  return (data ?? []).map(normalizeProduct);
}

export async function getCategories() {
  const supabase = createClient();

  // Try with sort_order first; fall back without it if the column doesn't exist
  let { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // If sort_order column doesn't exist (PGRST204 / 42703), retry without ordering
  if (error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("sort_order"))) {
    console.warn("sort_order column missing, falling back to name order");
    ({ data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }));
  }

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`, { cause: error });
  }
  return (data ?? []) as Category[];
}

export async function getProductById(id: string) {
  const { data, error } = await createClient()
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`, { cause: error });
  }
  return data ? normalizeProduct(data) : null;
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await createClient()
    .from("products")
    .select(productSelection)
    .in("id", ids)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to refresh cart products: ${error.message}`, { cause: error });
  }
  return (data ?? []).map(normalizeProduct);
}
