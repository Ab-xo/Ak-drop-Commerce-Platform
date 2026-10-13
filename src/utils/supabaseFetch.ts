import { createClient } from "@/lib/supabase";
import { Product, Category } from "@/types";

function normalizeProduct(row: any): Product {
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    ...row,
    stock: Number(row.quantity ?? row.stock ?? 0),
    main_image: row.main_image || images[0] || "",
    images,
    compare_price: row.compare_price ? Number(row.compare_price) : null,
    features: row.features || row.tags || [],
    category: row.categories || undefined,
  } as Product;
}

export async function getProducts(categorySlug?: string, featuredOnly?: boolean, limit?: number) {
  try {
    const supabase = createClient();

    // If filtering by a specific category, resolve its ID first to avoid
    // broken PostgREST embedded-filter syntax with !inner joins.
    let categoryId: string | null = null;
    if (categorySlug && categorySlug !== "all") {
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      if (catError || !catData) {
        console.error("Category not found:", categorySlug, catError);
        return [];
      }
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
    if (error) { console.error("Error fetching products — code:", error.code, "| message:", error.message, "| hint:", error.hint); return []; }
    return (data ?? []).map(normalizeProduct);
  } catch (error) { console.error("Error in getProducts:", error); return []; }
}

export async function getNewArrivals(limit = 4) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("*, categories(id, name, slug)").eq("is_active", true).eq("is_new_arrival", true).order("created_at", { ascending: false }).limit(limit);
    if (error) { console.error("Error fetching new arrivals:", error); return []; }
    return (data ?? []).map(normalizeProduct);
  } catch (error) { console.error("Error in getNewArrivals:", error); return []; }
}

export async function getCategories() {
  try {
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
      console.error("Error fetching categories — code:", error.code, "| message:", error.message, "| details:", error.details, "| hint:", error.hint);
      return [];
    }
    return (data ?? []) as Category[];
  } catch (error) { console.error("Error in getCategories:", error); return []; }
}

export async function getProductById(id: string) {
  try {
    const { data, error } = await createClient().from("products").select("*, categories(id, name, slug)").eq("id", id).eq("is_active", true).single();
    if (error) { console.error("Error fetching product by id:", error); return null; }
    return normalizeProduct(data);
  } catch (error) { console.error("Error in getProductById:", error); return null; }
}
