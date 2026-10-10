import { createClient } from "@/lib/supabase";

function formatSupabaseError(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === "object") {
        const details = error as Record<string, unknown>;
        return [details.message, details.code, details.details, details.hint]
            .filter(Boolean)
            .join(" | ") || JSON.stringify(error);
    }

    return String(error);
}

export async function testSupabaseConnection() {
    try {
        const supabase = createClient();
        
        console.log("🔍 Testing Supabase connection...");
        
        // The public storefront depends on products, not authenticated user profiles.
        const { error: productsError } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true });
            
        if (productsError) {
            console.error("❌ Supabase connection failed:", formatSupabaseError(productsError));
            return false;
        }
        
        console.log("✅ Supabase connection successful");

        const { error: categoriesError } = await supabase
            .from("categories")
            .select("count", { count: "exact", head: true });
            
        if (categoriesError) {
            console.error("❌ Categories table error:", formatSupabaseError(categoriesError));
            console.error("This means the categories table doesn't exist or has permission issues");
            return false;
        }
        
        console.log("✅ Categories table accessible");
        console.log("🎉 All tests passed! Supabase is working correctly.");
        
        return true;
        
    } catch (error) {
        console.error("❌ Unexpected error testing Supabase:", error);
        return false;
    }
}