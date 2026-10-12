import { createClient } from "@/lib/supabase";
import { Product, Category } from "@/types";

function normalizeProduct(row: any): Product {
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    ...row,
    stock: Number(row.quantity ?? row.stock ?? 0),
    main_image: row.main_image || images[0] || "",
    images,
    features: row.features || row.tags || [],
    category: row.categories || undefined,
  } as Product;
}

export async function getProducts(categorySlug?: string, featuredOnly?: boolean, limit?: number) {
  try {
    const supabase = createClient();
    let query = supabase.from("products").select("*, categories!inner(id, name, slug)").eq("is_active", true);
    if (categorySlug && categorySlug !== "all") query = query.eq("categories.slug", categorySlug);
    if (featuredOnly) query = query.eq("is_featured", true);
    if (limit) query = query.limit(limit);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) { console.error("Error fetching products:", error); return []; }
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
    const { data, error } = await createClient().from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true });
    if (error) { console.error("Error fetching categories:", error); return []; }
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
