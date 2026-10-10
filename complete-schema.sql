-- AK E-COMMERCE COMPLETE DATABASE SCHEMA
-- This file contains all tables needed for full feature parity with PHP version
-- Run this after the existing supabase-schema.sql and ecommerce-schema.sql

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
    currency TEXT DEFAULT 'USD' NOT NULL,
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

-- Add role to user_profiles for admin access
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'moderator'));

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

CREATE POLICY "Users can view their payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

-- NEWSLETTER SUBSCRIBERS (public read for unsubscribe page)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view by token" ON public.newsletter_subscribers
    FOR SELECT USING (true);

-- BLOG POSTS (public read for published posts)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);

-- PRODUCT REVIEWS (authenticated users can create, public can read approved)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reviews" ON public.product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- CONTACT SUBMISSIONS (anyone can submit)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);

-- PRODUCT VARIANTS (public read)
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variants" ON public.product_variants
    FOR SELECT USING (is_active = true);

-- WISHLIST
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);

-- COUPONS (public read for active coupons)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND valid_until > NOW());

-- COUPON USAGE
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.product_reviews TO authenticated;
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.wishlist TO authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT SELECT ON public.coupon_usage TO authenticated;

-- =============================================================================
-- SAMPLE DATA (Optional - for development)
-- =============================================================================

-- Insert sample admin user (password should be changed after signup)
-- Note: Actual admin creation should be done through Supabase Auth

-- Insert sample blog post
INSERT INTO public.blog_posts (
    title, 
    slug, 
    content, 
    excerpt, 
    category,
    is_published,
    published_at
) VALUES (
    'Welcome to AK Footwear Blog',
    'welcome-to-ak-footwear-blog',
    'Welcome to our new blog! Here we''ll share footwear trends, styling tips, and product updates.',
    'Welcome to the AK Footwear Blog',
    'News',
    true,
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- FUNCTIONS FOR ADMIN & ANALYTICS
-- =============================================================================

-- Function to get order statistics
CREATE OR REPLACE FUNCTION public.get_order_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue DECIMAL,
    average_order_value DECIMAL,
    pending_orders BIGINT,
    completed_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value,
        COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) as pending_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as completed_orders
    FROM public.orders
    WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product inventory status
CREATE OR REPLACE FUNCTION public.get_low_stock_products()
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    quantity INTEGER,
    low_stock_threshold INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        name,
        quantity,
        low_stock_threshold
    FROM public.products
    WHERE quantity <= low_stock_threshold
    AND is_active = true
    ORDER BY quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update product sales count (called after order completion)
CREATE OR REPLACE FUNCTION public.increment_product_sales()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE public.products
        SET sales_count = sales_count + order_items.quantity
        FROM public.order_items
        WHERE products.id = order_items.product_id
        AND order_items.order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_sales_count
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.increment_product_sales();

-- =============================================================================
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

-- 4. Set up admin role for initial admin user via Supabase dashboard

-- 5. Create indexes on frequently queried columns as the database grows

-- =============================================================================
-- COMPLETED
-- =============================================================================
