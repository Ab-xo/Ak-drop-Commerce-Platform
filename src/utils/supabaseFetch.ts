import { createClient } from "@/lib/supabase";
import { Product, Category } from "@/types";

function normalizeProduct(row: Record<string, unknown>): Product {
  const images = Array.isArray(row.images)
    ? row.images.filter((image): image is string => typeof image === "string")
    : [];
  const features = Array.isArray(row.features)
    ? row.features.filter((feature): feature is string => typeof feature === "string")
    : Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
  return {
    ...row,
    stock: Number(row.quantity ?? row.stock ?? 0),
    main_image: typeof row.main_image === "string" ? row.main_image : images[0] || "",
    images,
    compare_price: row.compare_price ? Number(row.compare_price) : null,
    features,
    category: row.categories || undefined,
  } as Product;
}

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
    .select("*, categories(id, name, slug)")
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
    .select("*, categories(id, name, slug)")
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
