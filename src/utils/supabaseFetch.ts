import { createClient } from "@/lib/supabase";
import { Product, Category } from "@/types";

export async function getProducts(categorySlug?: string, featuredOnly?: boolean, limit?: number) {
    try {
        const supabase = createClient();
        let query = supabase.from("products").select("*, categories!inner(id, name, slug)");
        if (categorySlug && categorySlug !== "all") query = query.eq("categories.slug", categorySlug);
        if (featuredOnly) query = query.eq("is_featured", true);
        if (limit) query = query.limit(limit);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) { console.error("Error fetching products:", error); return []; }
        return (data ?? []) as Product[];
    } catch (error) { console.error("Error in getProducts:", error); return []; }
}

export async function getNewArrivals(limit = 4) {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("products").select("*, categories(id, name, slug)").eq("is_new_arrival", true).order("created_at", { ascending: false }).limit(limit);
        if (error) { console.error("Error fetching new arrivals:", error); return []; }
        return (data ?? []) as Product[];
    } catch (error) { console.error("Error in getNewArrivals:", error); return []; }
}

export async function getCategories() {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("categories").select("*").order("name");
        if (error) { console.error("Error fetching categories:", error); return []; }
        return (data ?? []) as Category[];
    } catch (error) { console.error("Error in getCategories:", error); return []; }
}

export async function getProductById(id: string) {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("products").select("*, categories(id, name, slug)").eq("id", id).single();
        if (error) { console.error("Error fetching product by id:", error); return null; }
        return data as Product;
    } catch (error) { console.error("Error in getProductById:", error); return null; }
}
