import { createClient } from "@/lib/supabase";
import { Product, Category } from "@/types";

export async function getProducts(categorySlug?: string, featuredOnly?: boolean, limit?: number) {
    try {
        const supabase = createClient();
        
        // Start with a simple query first
        let query = supabase.from("products").select("*");

        if (categorySlug && categorySlug !== 'all') {
            // Simple category filter without join for now
            query = query.eq("category_id", categorySlug);
        }

        if (featuredOnly) {
            query = query.eq("is_featured", true);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching products:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            return [];
        }

        console.log("Products fetched successfully:", data?.length || 0, "items");
        return data as Product[];
    } catch (error) {
        console.error("Error in getProducts:", error);
        return [];
    }
}

export async function getNewArrivals(limit: number = 4) {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("is_new_arrival", true)
            .limit(limit)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching new arrivals:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            return [];
        }

        console.log("New arrivals fetched successfully:", data?.length || 0, "items");
        return data as Product[];
    } catch (error) {
        console.error("Error in getNewArrivals:", error);
        return [];
    }
}

export async function getCategories() {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("categories").select("*");

        if (error) {
            console.error("Error fetching categories:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            return [];
        }

        console.log("Categories fetched successfully:", data?.length || 0, "items");
        return data as Category[];
    } catch (error) {
        console.error("Error in getCategories:", error);
        return [];
    }
}

export async function getProductById(id: string) {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error fetching product by id:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            return null;
        }

        return data as Product;
    } catch (error) {
        console.error("Error in getProductById:", error);
        return null;
    }
}
