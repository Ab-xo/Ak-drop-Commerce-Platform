-- AK ECOMM Product and Category Tables
-- Run this after the user-schema.sql

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

-- Create policies for categories (public read access)
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Create policies for products (public read access)
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Create trigger for categories updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for products updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;

-- Insert sample categories
INSERT INTO public.categories (name, slug, description) VALUES
('Footwear', 'footwear', 'Premium shoes and sneakers'),
('Fashion', 'fashion', 'Trendy clothing and apparel'),
('Electronics', 'electronics', 'Latest gadgets and tech'),
('Accessories', 'accessories', 'Stylish accessories and add-ons')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, slug, description, short_description, price, category_id, is_featured, is_new_arrival) 
SELECT 
    'Premium Running Shoes',
    'premium-running-shoes',
    'High-quality running shoes with advanced cushioning technology.',
    'Premium running shoes for ultimate comfort',
    129.99,
    c.id,
    true,
    true
FROM public.categories c WHERE c.slug = 'footwear'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, short_description, price, category_id, is_featured) 
SELECT 
    'Wireless Headphones',
    'wireless-headphones',
    'Premium wireless headphones with noise cancellation.',
    'High-quality wireless audio experience',
    199.99,
    c.id,
    true
FROM public.categories c WHERE c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, short_description, price, category_id, is_new_arrival) 
SELECT 
    'Designer T-Shirt',
    'designer-t-shirt',
    'Comfortable and stylish designer t-shirt made from premium cotton.',
    'Premium cotton designer t-shirt',
    49.99,
    c.id,
    true
FROM public.categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, short_description, price, category_id) 
SELECT 
    'Leather Wallet',
    'leather-wallet',
    'Handcrafted leather wallet with multiple card slots.',
    'Premium leather wallet',
    79.99,
    c.id
FROM public.categories c WHERE c.slug = 'accessories'
ON CONFLICT (slug) DO NOTHING;