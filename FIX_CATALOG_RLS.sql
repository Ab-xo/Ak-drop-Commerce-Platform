-- ============================================================================
-- FIX: Categories & Products fetch errors
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================================

-- 1. Ensure sort_order column exists on categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Drop and recreate RLS policies for categories (allow anon read)
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- 3. Drop and recreate RLS policies for products (allow anon read)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  USING (true);

-- 4. Make sure RLS is enabled on both tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;

-- 6. Verify: check if tables have data
SELECT 'categories' as tbl, COUNT(*) as rows FROM public.categories
UNION ALL
SELECT 'products' as tbl, COUNT(*) as rows FROM public.products;

-- 7. Verify: confirm RLS policies exist
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('categories', 'products')
ORDER BY tablename, policyname;
