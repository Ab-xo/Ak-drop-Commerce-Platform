-- AK DROP MODERN — CANONICAL SUPABASE SETUP
-- Apply in the Supabase SQL Editor as a project owner.
-- This file combines profiles/orders, catalog, commerce tables, and the current
-- multi-category catalog seed. It is safe to rerun; seed rows upsert by slug.
-- Product prices in the included sample catalog are numeric ETB values.
-- Client roles can read active catalog data and their own records. Order creation,
-- payment state, moderation, inventory writes, and staff operations stay server-side.

BEGIN;
-- AK ECOMM User Authentication Schema for Supabase
-- Profile and order tables used by AK Drop Modern

-- Enable Row Level Security

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert catalogs created by the older text-array schema before seeding JSON images.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products'
      AND column_name = 'images' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN images DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN images TYPE JSONB USING to_jsonb(images);
    ALTER TABLE public.products ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Username availability is public; profile identifiers and personal fields are not.
DROP POLICY IF EXISTS "Anyone can check username availability" ON public.user_profiles;
CREATE POLICY "Anyone can check username availability" ON public.user_profiles
    FOR SELECT TO anon USING (true);

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'username', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on profile changes
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create orders table for customer order history
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ETB',
    shipping_address JSONB,
    billing_address JSONB,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Create trigger for orders updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customer profile fields are editable; order creation and fulfillment stay server-controlled.
REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT SELECT (username) ON TABLE public.user_profiles TO anon;
GRANT INSERT (id, email, full_name, username, phone, date_of_birth, gender, avatar_url, address, preferences, updated_at)
  ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE (id, email, full_name, username, phone, date_of_birth, gender, avatar_url, address, preferences, updated_at)
  ON TABLE public.user_profiles TO authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;

-- AK ECOMM Product and Category Tables
-- Catalog tables used by AK Drop Modern

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sku TEXT UNIQUE,
    barcode TEXT,
    track_quantity BOOLEAN DEFAULT TRUE,
    quantity INTEGER DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions JSONB DEFAULT '{}',
    category_id UUID REFERENCES public.categories(id),
    images JSONB DEFAULT '[]',
    is_featured BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    seo_title TEXT,
    seo_description TEXT,
    tags TEXT[],
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert catalogs created by the older text-array schema before seeding JSON images.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products'
      AND column_name = 'images' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN images DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN images TYPE JSONB USING to_jsonb(images);
    ALTER TABLE public.products ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON public.products(is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Remove unconditional catalog policies created by earlier fix scripts.
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
-- Create policies for categories (public read access)
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Create policies for products (public read access)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Create trigger for categories updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for products updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
REVOKE ALL ON TABLE public.categories, public.products FROM anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;



-- Commerce extension tables

-- =============================================================================
-- MISSING TABLES FROM PHP VERSION
-- =============================================================================

-- 1. ORDER ITEMS TABLE
-- Stores individual items within each order (replaces PHP orders_items table)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_slug TEXT,
    product_image TEXT,
    product_sku TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    size TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- 2. PAYMENTS TABLE
-- Stores payment transactions (replaces PHP payments table)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'ETB' NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT,
    payment_method_details JSONB DEFAULT '{}',
    failure_message TEXT,
    receipt_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);

-- 3. NEWSLETTER SUBSCRIBERS TABLE
-- Stores email subscribers (replaces PHP newsletter_subscribers table)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    verification_token TEXT UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source TEXT DEFAULT 'website',
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_verified ON public.newsletter_subscribers(is_verified);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON public.newsletter_subscribers(is_active);

-- 4. BLOG POSTS TABLE
-- Stores blog content (new feature)
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    reading_time INTEGER,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_author ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_blog_category ON public.blog_posts(category);

-- 5. PRODUCT REVIEWS TABLE
-- Stores customer reviews and ratings
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(rating);

-- 6. CONTACT SUBMISSIONS TABLE
-- Stores contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
    admin_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_email ON public.contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_created ON public.contact_submissions(created_at);

-- 7. PRODUCT VARIANTS TABLE
-- Stores product variations (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sku TEXT UNIQUE,
    size TEXT,
    color TEXT,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

-- 8. WISHLIST TABLE
-- Stores user wishlists
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.wishlist(product_id);

-- 9. COUPONS TABLE
-- Stores discount coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    minimum_order_value DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

-- 10. COUPON USAGE TABLE
-- Tracks coupon usage per user
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON public.coupon_usage(order_id);

-- =============================================================================
-- UPDATES TO EXISTING TABLES
-- =============================================================================

-- Add stock management fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS out_of_stock_threshold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Add order tracking fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
CREATE POLICY "Users can view their order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- PAYMENTS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their payments" ON public.payments;
CREATE POLICY "Users can view their payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

-- NEWSLETTER SUBSCRIBERS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- BLOG POSTS (public read for published posts)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);

-- PRODUCT REVIEWS (authenticated users can create, public can read approved)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews
    FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their reviews" ON public.product_reviews;
CREATE POLICY "Users can update their reviews" ON public.product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- CONTACT SUBMISSIONS (anyone can submit)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);

-- PRODUCT VARIANTS (public read)
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active variants" ON public.product_variants;
CREATE POLICY "Anyone can view active variants" ON public.product_variants
    FOR SELECT USING (is_active = true);

-- WISHLIST
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their wishlist" ON public.wishlist;
CREATE POLICY "Users can manage their wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);

-- COUPONS (public read for active coupons)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND valid_until > NOW());

-- COUPON USAGE
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can view their coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

REVOKE ALL ON TABLE public.order_items, public.payments, public.newsletter_subscribers,
  public.blog_posts, public.product_reviews, public.contact_submissions,
  public.product_variants, public.wishlist, public.coupons, public.coupon_usage
  FROM anon, authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.payments TO authenticated;
GRANT INSERT (email) ON TABLE public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON TABLE public.blog_posts TO anon, authenticated;
GRANT SELECT ON TABLE public.product_reviews TO anon, authenticated;
GRANT INSERT (product_id, user_id, rating, title, comment, images)
  ON TABLE public.product_reviews TO authenticated;
GRANT UPDATE (rating, title, comment, images)
  ON TABLE public.product_reviews TO authenticated;
GRANT INSERT (name, email, phone, subject, message)
  ON TABLE public.contact_submissions TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wishlist TO authenticated;
GRANT SELECT ON TABLE public.coupons TO anon, authenticated;
GRANT SELECT ON TABLE public.coupon_usage TO authenticated;
-- =============================================================================

-- Remove SECURITY DEFINER analytics helpers from earlier setup scripts. Their
-- default public execute permission exposed store-wide order and stock data.
DROP TRIGGER IF EXISTS update_product_sales_count ON public.orders;
DROP FUNCTION IF EXISTS public.increment_product_sales();
DROP FUNCTION IF EXISTS public.get_order_stats(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_low_stock_products();
-- NOTES
-- =============================================================================

-- 1. Remember to set up Supabase Storage bucket for images:
--    - product-images (public)
--    - blog-images (public)
--    - user-avatars (private with user access)

-- 2. Configure Stripe webhook endpoint:
--    - /api/webhooks/stripe
--    - Events: payment_intent.succeeded, payment_intent.payment_failed

-- 3. Configure Resend for transactional emails:
--    - Order confirmations
--    - Newsletter verification
--    - Password resets
--    - Contact form submissions

-- 4. Add staff authorization only with the server-verified admin phase.

-- 5. Create indexes on frequently queried columns as the database grows

-- =============================================================================
-- COMPLETED
-- =============================================================================


-- STEP 2: Categories
-- ─────────────────────────────────────────────
INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order) VALUES
  ('Footwear',     'footwear',     'Sneakers, boots, sandals and everyday kicks.',
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', true, 10),
  ('Shirts',       'shirts',       'Casual tees, polo shirts, and formal button-ups.',
   'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85', true, 20),
  ('Pants',        'pants',        'Jeans, chinos, cargo pants and joggers.',
   'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85', true, 30),
  ('Outerwear',    'outerwear',    'Jackets, hoodies, coats and layering pieces.',
   'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85', true, 40),
  ('Bags',         'bags',         'Backpacks, duffels, tote bags and belt bags.',
   'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', true, 50),
  ('Accessories',  'accessories',  'Caps, watches, belts, sunglasses and more.',
   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85', true, 60),
  ('Electronics',  'electronics',  'Earbuds, chargers, cables and tech essentials.',
   'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85', true, 70),
  ('Sports',       'sports',       'Activewear, gym gear and athletic essentials.',
   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85', true, 80)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  image_url   = EXCLUDED.image_url,
  is_active   = true,
  sort_order  = EXCLUDED.sort_order;

-- ─────────────────────────────────────────────
-- STEP 3: Products
-- ─────────────────────────────────────────────

-- ── FOOTWEAR ──────────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id,
  jsonb_build_array(p.img),
  p.featured, p.new_arrival, true,
  p.tags, p.attrs::jsonb
FROM (VALUES
  ('Air Knit Runner',         'air-knit-runner',
   'Breathable knit upper with responsive foam.',
   'An ultra-lightweight running shoe engineered with a seamless knit upper that wraps your foot for a sock-like fit. Features responsive foam midsole, rubber outsole with multi-directional grip, and reflective details for low-light visibility.',
   1899.00, 2299.00, 'AK-FW-001', 30,
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['running','knit','new-drop'],
   '{"color":"Black/White","sizes":["40","41","42","43","44","45"],"gender":"unisex"}'),

  ('Classic Low Sneaker',     'classic-low-sneaker',
   'Timeless court style for everyday wear.',
   'A clean low-top sneaker with a premium leather upper, cushioned insole, and durable rubber outsole. The minimalist silhouette pairs with anything from jeans to joggers, making it the most versatile shoe in your rotation.',
   1599.00, 1999.00, 'AK-FW-002', 45,
   'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['lifestyle','leather','classic'],
   '{"color":"White","sizes":["39","40","41","42","43","44","45"],"gender":"unisex"}'),

  ('Urban Hiker Boot',        'urban-hiker-boot',
   'Trail-ready ankle boot for city streets.',
   'A rugged ankle boot that blends outdoor durability with streetwear aesthetic. Waterproof synthetic upper, padded collar, Vibram-inspired outsole, and a lug pattern that handles both cobblestone and concrete.',
   2499.00, 2999.00, 'AK-FW-003', 18,
   'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['boots','waterproof','hiking'],
   '{"color":"Tan","sizes":["40","41","42","43","44","45","46"],"material":"synthetic leather"}'),

  ('Slide Pro',               'slide-pro',
   'Cushioned slides for home and poolside.',
   'A thick contoured footbed with arch support and a grippy rubber outsole. The adjustable single strap sits flush against the foot for an ergonomic feel all day long.',
   699.00, 899.00, 'AK-FW-004', 60,
   'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['slides','sandals','casual'],
   '{"color":"Black","sizes":["39","40","41","42","43","44"],"gender":"unisex"}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'footwear'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ── SHIRTS ────────────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id, jsonb_build_array(p.img), p.featured, p.new_arrival, true, p.tags, p.attrs::jsonb
FROM (VALUES
  ('Essential Oversized Tee',  'essential-oversized-tee',
   '100% cotton relaxed-fit tee for everyday wear.',
   'Cut from 220 GSM combed cotton for a substantial, non-clingy drape. Dropped shoulders, ribbed crew neck, and double-stitched hems give this staple tee a clean finish that holds its shape wash after wash.',
   549.00, 699.00, 'AK-SH-001', 80,
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['tshirt','cotton','oversized'],
   '{"color":"White","sizes":["XS","S","M","L","XL","XXL"],"material":"100% cotton","fit":"oversized"}'),

  ('Oxford Button-Up Shirt',   'oxford-button-up-shirt',
   'Crisp oxford weave for smart-casual occasions.',
   'Woven from a classic oxford cotton, this button-up has a spread collar, chest pocket, and a slightly relaxed body that transitions from office to weekend. Machine washable and wrinkle-resistant.',
   1149.00, 1399.00, 'AK-SH-002', 35,
   'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['shirt','formal','oxford'],
   '{"color":"Light Blue","sizes":["S","M","L","XL","XXL"],"material":"cotton oxford","fit":"regular"}'),

  ('Graphic Print Tee',        'graphic-print-tee',
   'Bold street-art inspired graphic on heavy cotton.',
   'A heavyweight 240 GSM tee featuring an original AK Drop graphic printed with water-based inks that stay vibrant after repeated washing. Boxy fit, reinforced collar, and raw-edge hem details.',
   649.00, 799.00, 'AK-SH-003', 55,
   'https://images.unsplash.com/photo-1503341733017-1901578f9f1e?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['tshirt','graphic','streetwear'],
   '{"color":"Black","sizes":["XS","S","M","L","XL","XXL"],"material":"heavy cotton","fit":"boxy"}'),

  ('Linen Camp Collar Shirt',  'linen-camp-collar-shirt',
   'Breathable linen for warm-weather styling.',
   'A lightweight linen-blend camp-collar shirt with a relaxed open hem. The camp collar sits flat and unfussy, ideal for tucking or leaving open over a tee. Coconut shell buttons finish the tropical-ready look.',
   999.00, 1249.00, 'AK-SH-004', 28,
   'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85',
   false, false,
   ARRAY['shirt','linen','summer'],
   '{"color":"Sage Green","sizes":["S","M","L","XL"],"material":"linen blend","fit":"relaxed"}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'shirts'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ── PANTS ─────────────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id, jsonb_build_array(p.img), p.featured, p.new_arrival, true, p.tags, p.attrs::jsonb
FROM (VALUES
  ('Slim Fit Chino',          'slim-fit-chino',
   'Stretch cotton chino with a tailored silhouette.',
   'A mid-weight stretch twill chino with just enough elastane to move with you. Flat-front cut, slim through the thigh and tapered at the ankle for a clean, modern line. Available in multiple neutrals.',
   1299.00, 1599.00, 'AK-PT-001', 40,
   'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['chino','slim','smart-casual'],
   '{"color":"Khaki","sizes":["28","30","32","34","36"],"material":"stretch twill","fit":"slim"}'),

  ('Relaxed Cargo Pants',     'relaxed-cargo-pants',
   'Utility cargo with six pockets and a relaxed fit.',
   'Built from a durable ripstop cotton blend, these cargos feature two bellows thigh pockets, adjustable hems, and a relaxed waist with a hidden drawstring. The articulated knee panelling gives unrestricted movement.',
   1499.00, 1799.00, 'AK-PT-002', 32,
   'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['cargo','relaxed','utility'],
   '{"color":"Olive","sizes":["28","30","32","34","36","38"],"material":"ripstop cotton","fit":"relaxed"}'),

  ('Classic Straight Jeans',  'classic-straight-jeans',
   'Medium-wash denim with a timeless straight cut.',
   'Cut from 12 oz. selvedge-inspired denim with a slight stretch for comfort. Classic five-pocket construction, medium wash with subtle fade, and a straight leg that stacks neatly on any shoe.',
   1799.00, 2199.00, 'AK-PT-003', 25,
   'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85',
   false, false,
   ARRAY['jeans','denim','straight'],
   '{"color":"Medium Blue","sizes":["28","30","32","34","36"],"material":"stretch denim","fit":"straight"}'),

  ('Tapered Jogger',          'tapered-jogger',
   'Soft French terry jogger for training and lounging.',
   'Garment-dyed French terry with a tapered leg, ribbed ankle cuffs, and a comfortable elastic waistband with an adjustable drawcord. Side and rear pockets. Works from the gym to the coffee shop.',
   999.00, 1199.00, 'AK-PT-004', 50,
   'https://images.unsplash.com/photo-1553830591-d8632a99e6ff?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['jogger','sweatpants','athletic'],
   '{"color":"Charcoal","sizes":["XS","S","M","L","XL","XXL"],"material":"french terry","fit":"tapered"}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'pants'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ── OUTERWEAR ─────────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id, jsonb_build_array(p.img), p.featured, p.new_arrival, true, p.tags, p.attrs::jsonb
FROM (VALUES
  ('Heavyweight Zip Hoodie',   'heavyweight-zip-hoodie',
   '420 GSM fleece zip-up hoodie with kangaroo pockets.',
   'A premium 420 GSM brushed fleece full-zip hoodie with an oversized fit, double-layered hood, ribbed cuffs and hem, and a front kangaroo pocket. Designed to be the last hoodie you ever need to buy.',
   1799.00, 2199.00, 'AK-OW-001', 38,
   'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['hoodie','fleece','zip-up'],
   '{"color":"Black","sizes":["XS","S","M","L","XL","XXL"],"material":"420gsm fleece","fit":"oversized"}'),

  ('Technical Shell Jacket',  'technical-shell-jacket',
   'Waterproof 3-layer shell for wind and rain.',
   'A 3-layer bonded shell jacket with taped seams, adjustable cuffs and hem, a helmet-compatible hood, and underarm vents for breathability. Packs into its own chest pocket. Ready for anything the city throws at you.',
   3499.00, 4299.00, 'AK-OW-002', 15,
   'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['jacket','waterproof','technical'],
   '{"color":"Forest Green","sizes":["XS","S","M","L","XL","XXL"],"waterproof":"10000mm","fit":"regular"}'),

  ('Varsity Bomber Jacket',   'varsity-bomber-jacket',
   'Classic varsity bomber with ribbed collar and cuffs.',
   'A wool-blend body with leather-look sleeves, ribbed collar, cuffs and hem. Interior quilted lining keeps warmth in. Two front slash pockets and a chest welt pocket. Classic heritage styling for the modern wardrobe.',
   2799.00, 3499.00, 'AK-OW-003', 20,
   'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['jacket','varsity','bomber'],
   '{"color":"Navy/White","sizes":["XS","S","M","L","XL","XXL"],"material":"wool blend","fit":"regular"}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'outerwear'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ── BAGS ──────────────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id, jsonb_build_array(p.img), p.featured, p.new_arrival, true, p.tags, p.attrs::jsonb
FROM (VALUES
  ('Urban Commuter Backpack',  'urban-commuter-backpack',
   '20L laptop backpack with padded back panel.',
   'A 20-litre commuter backpack with a padded 15" laptop sleeve, quick-access top pocket, two water bottle pockets, and a breathable back panel with lumbar support. Water-resistant 600D polyester shell.',
   1999.00, 2499.00, 'AK-BG-001', 22,
   'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['backpack','laptop','commute'],
   '{"color":"Black","capacity":"20L","laptop":"up to 15 inch","material":"600D polyester"}'),

  ('Crossbody Messenger Bag', 'crossbody-messenger-bag',
   'Compact messenger for daily essentials.',
   'A slim crossbody with an adjustable strap, magnetic buckle closure, front zip pocket, and an interior organizer panel. Fits a tablet and daily essentials without the bulk of a full backpack.',
   1199.00, 1499.00, 'AK-BG-002', 30,
   'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['crossbody','messenger','daily'],
   '{"color":"Tan","capacity":"6L","material":"canvas","strap":"adjustable"}'),

  ('Weekender Duffel 40L',    'weekender-duffel-40l',
   'Spacious 40L duffel with shoe compartment.',
   'A roomy 40-litre canvas duffel with a vented base shoe compartment, padded handles, a removable and adjustable shoulder strap, and end pockets for quick-access items. Built for 2–4 day trips.',
   2299.00, 2799.00, 'AK-BG-003', 14,
   'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['duffel','travel','weekend'],
   '{"color":"Olive Canvas","capacity":"40L","material":"waxed canvas","shoe_compartment":true}'),

  ('Mini Belt Bag',           'mini-belt-bag',
   'Compact hands-free belt bag for the essentials.',
   'A sleek 2-litre belt bag with a main zip compartment, front organiser pocket, and a quick-release buckle. Wear across the chest, at the waist, or over the shoulder. Water-resistant nylon.',
   699.00, 899.00, 'AK-BG-004', 48,
   'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['beltbag','fanny-pack','compact'],
   '{"color":"Black","capacity":"2L","material":"nylon","carry":"waist/chest/shoulder"}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'bags'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ── ACCESSORIES ───────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id, jsonb_build_array(p.img), p.featured, p.new_arrival, true, p.tags, p.attrs::jsonb
FROM (VALUES
  ('Minimalist Steel Watch',  'minimalist-steel-watch',
   'Japanese quartz movement with brushed steel case.',
   'A 40mm brushed stainless steel case with a domed mineral crystal, Japanese quartz movement, and a matching steel bracelet with butterfly clasp. 5ATM water resistance. The watch that goes with everything.',
   1599.00, 1999.00, 'AK-AC-001', 20,
   'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['watch','steel','minimal'],
   '{"color":"Silver","diameter":"40mm","movement":"Japanese quartz","water_resistance":"5ATM"}'),

  ('Six-Panel Cotton Cap',    'six-panel-cotton-cap',
   'Structured 6-panel cap with embroidered logo.',
   'A classic six-panel cap in 100% chino cotton twill with a pre-curved bill, embroidered AK Drop logo on the front, and an adjustable strapback closure for a universal fit.',
   499.00, 649.00, 'AK-AC-002', 65,
   'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['cap','hat','streetwear'],
   '{"color":"Black","size":"adjustable","material":"chino cotton twill"}'),

  ('UV400 Wraparound Shades', 'uv400-wraparound-shades',
   'Polarized lenses with UV400 protection.',
   'Lightweight TR90 frames with polarized lenses offering 100% UV400 protection. Anti-reflective coating, spring hinges for comfort, and a semi-wraparound silhouette that works for both sport and street.',
   899.00, 1199.00, 'AK-AC-003', 35,
   'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['sunglasses','uv400','polarized'],
   '{"color":"Matte Black","lens":"polarized","uv_protection":"UV400","frame":"TR90"}'),

  ('Woven Leather Belt',      'woven-leather-belt',
   'Full-grain leather with a nickel-free buckle.',
   'Hand-stitched full-grain leather belt with a clean edge finish and a solid nickel-free zinc alloy buckle. 35mm width suits most trouser loops and pairs equally well with casual and formal outfits.',
   799.00, 999.00, 'AK-AC-004', 42,
   'https://images.unsplash.com/photo-1594938298603-c8148c4b4d83?auto=format&fit=crop&w=1200&q=85',
   false, false,
   ARRAY['belt','leather','accessories'],
   '{"color":"Brown","width":"35mm","material":"full-grain leather","sizes":["S","M","L","XL"]}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'accessories'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ── ELECTRONICS ───────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id, jsonb_build_array(p.img), p.featured, p.new_arrival, true, p.tags, p.attrs::jsonb
FROM (VALUES
  ('True Wireless Earbuds',   'true-wireless-earbuds',
   'ANC earbuds with 32hr total battery life.',
   'Hybrid Active Noise Cancellation blocks up to 35dB, while Transparency mode lets the world in when you need it. Bluetooth 5.3, 8hr bud battery + 24hr case, IPX5 water resistance, and multipoint connection for two devices simultaneously.',
   2499.00, 3199.00, 'AK-EL-001', 25,
   'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['earbuds','anc','wireless'],
   '{"color":"Midnight Black","battery_buds":"8hr","battery_case":"24hr","anc":true,"ipx":"IPX5"}'),

  ('65W GaN USB-C Charger',   '65w-gan-usb-c-charger',
   'Compact GaN charger for laptops, phones and tablets.',
   'A palm-sized GaN charger with one USB-C port (65W PD) and one USB-A port (18W QC 3.0). Powers a laptop and a phone simultaneously. Foldable pins, universal voltage (100–240V), and travel-ready certification.',
   899.00, 1199.00, 'AK-EL-002', 50,
   'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['charger','gan','usb-c'],
   '{"color":"White","wattage":"65W","ports":["USB-C 65W","USB-A 18W"],"voltage":"100-240V"}'),

  ('Portable Power Bank 20K', 'portable-power-bank-20k',
   '20,000mAh power bank with 22.5W fast charge.',
   '20,000mAh lithium polymer cells with 22.5W USB-C input/output and 18W USB-A output. Digital LED display shows remaining charge percentage. Charges two devices at full speed simultaneously.',
   1299.00, 1699.00, 'AK-EL-003', 30,
   'https://images.unsplash.com/photo-1609592806596-b70f1f64e9b8?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['powerbank','charging','portable'],
   '{"color":"Black","capacity":"20000mAh","max_output":"22.5W","ports":["USB-C","USB-A"]}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'electronics'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ── SPORTS ────────────────────────────────────
INSERT INTO public.products (name, slug, short_description, description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price, p.sku, p.qty,
  c.id, jsonb_build_array(p.img), p.featured, p.new_arrival, true, p.tags, p.attrs::jsonb
FROM (VALUES
  ('Pro Training Shorts',     'pro-training-shorts',
   '4-way stretch training shorts with liner.',
   'Cut from a moisture-wicking 4-way stretch fabric with a built-in mesh liner, side zip pocket, and elastic waistband with drawcord. 7" inseam balances coverage and mobility for any training discipline.',
   799.00, 999.00, 'AK-SP-001', 55,
   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85',
   true, true,
   ARRAY['shorts','training','athletic'],
   '{"color":"Black","sizes":["XS","S","M","L","XL","XXL"],"inseam":"7 inch","material":"stretch polyester"}'),

  ('Compression Base Layer',  'compression-base-layer',
   'Muscle-support compression top for training.',
   'A close-fit compression long-sleeve constructed from 82% nylon / 18% elastane. Flatlock seams prevent chafing, UPF 50+ fabric protects in outdoor training, and the moisture-transport system keeps you dry under heavy load.',
   999.00, 1299.00, 'AK-SP-002', 40,
   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
   false, true,
   ARRAY['compression','baselayer','training'],
   '{"color":"Charcoal","sizes":["XS","S","M","L","XL","XXL"],"material":"nylon/elastane","upf":"50+"}'),

  ('Gym Duffle Bag 25L',      'gym-duffle-bag-25l',
   'Ventilated gym bag with wet/dry compartment.',
   'A 25-litre gym duffle with a vented shoe/wet-gear compartment, main zip access, front organizer pocket, and padded carry handles with a removable shoulder strap. Reflective strips for visibility at dawn or dusk.',
   1499.00, 1799.00, 'AK-SP-003', 22,
   'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=85',
   true, false,
   ARRAY['gym','bag','sports'],
   '{"color":"Black/Grey","capacity":"25L","wet_dry_compartment":true,"material":"polyester"}')
) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,tags,attrs)
JOIN public.categories c ON c.slug = 'sports'
ON CONFLICT (slug) DO UPDATE SET
  description=EXCLUDED.description, short_description=EXCLUDED.short_description,
  price=EXCLUDED.price, compare_price=EXCLUDED.compare_price,
  quantity=EXCLUDED.quantity, images=EXCLUDED.images,
  is_featured=EXCLUDED.is_featured, is_new_arrival=EXCLUDED.is_new_arrival,
  tags=EXCLUDED.tags, attributes=EXCLUDED.attributes, is_active=true;

-- ─────────────────────────────────────────────
-- STEP 4: Verify
-- ─────────────────────────────────────────────
SELECT c.name AS category, COUNT(p.id) AS products
FROM public.categories c
LEFT JOIN public.products p ON p.category_id = c.id AND p.is_active = true
GROUP BY c.name
ORDER BY c.sort_order;


-- Keep defaults aligned with the storefront currency for future orders.
ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'ETB';
ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'ETB';

COMMIT;