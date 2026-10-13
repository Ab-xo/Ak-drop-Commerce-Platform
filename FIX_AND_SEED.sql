-- ============================================================================
-- AK DROP — FIX SCHEMA + SEED CATALOG
-- Paste this entire file into Supabase SQL Editor and run it.
-- Safe to re-run. Adds missing columns, upserts all categories & products.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add ALL missing columns to products & categories
-- ─────────────────────────────────────────────────────────────────────────────

-- Categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url   TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT TRUE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order  INTEGER DEFAULT 0;

-- Products — core identity
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug             TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku              TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode          TEXT;

-- Products — pricing & inventory
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_price    DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price       DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity         INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS track_quantity   BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight           DECIMAL(8,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions       JSONB DEFAULT '{}';

-- Products — media & taxonomy
-- images may already exist as text[] — drop default, alter type, restore default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products'
      AND column_name='images' AND data_type='ARRAY'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN images DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN images TYPE JSONB USING to_jsonb(images);
    ALTER TABLE public.products ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;
END $$;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags   TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS attributes       JSONB DEFAULT '{}';

-- Products — flags
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active        BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured      BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival   BOOLEAN DEFAULT FALSE;

-- Products — SEO
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title        TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description  TEXT;

-- Products — timestamps
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Categories — timestamps
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint on slug if not already there (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_slug_key' AND conrelid = 'public.products'::regclass
  ) THEN
    -- Only add if slug column has no nulls yet (new table)
    -- We'll use a unique index instead which handles nulls safely
    BEGIN
      ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
    EXCEPTION WHEN others THEN
      -- constraint already exists or conflicts, skip
      NULL;
    END;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products    TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Categories
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order) VALUES
('Footwear',    'footwear',    'Sneakers, runners, boots, and everyday footwear.',         'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', true, 10),
('Shirts',      'shirts',      'Tees, polos, button-ups, and lightweight everyday layers.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85', true, 20),
('Pants',       'pants',       'Denim, chinos, cargos, and comfortable everyday trousers.', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85', true, 30),
('Outerwear',   'outerwear',   'Hoodies, jackets, shells, and premium layering pieces.',    'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85', true, 40),
('Bags',        'bags',        'Backpacks, duffels, crossbody bags, and daily carry.',      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', true, 50),
('Accessories', 'accessories', 'Caps, watches, sunglasses, belts, and finishing details.',  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85', true, 60),
('Electronics', 'electronics', 'Audio, charging, and everyday tech essentials.',            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85', true, 70),
('Sports',      'sports',      'Training apparel and equipment for active routines.',       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85', true, 80)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url   = EXCLUDED.image_url,
  is_active   = true,
  sort_order  = EXCLUDED.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Products (insert by category slug join, upsert on slug)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.products
  (name, slug, short_description, description, price, compare_price, sku, quantity,
   category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT
  p.name, p.slug, p.short_desc, p.description, p.price, p.compare_price,
  p.sku, p.qty, c.id,
  jsonb_build_array(p.img),
  p.featured, p.new_arrival, true,
  p.tags, p.attrs::jsonb
FROM (VALUES
  -- FOOTWEAR
  ('Air Knit Runner','air-knit-runner','Breathable knit upper with responsive foam.',
   'An ultra-lightweight running shoe with a seamless knit upper, responsive foam midsole, multi-directional rubber outsole, and reflective details for low-light visibility.',
   1899.00,2299.00,'AK-FW-001',30,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
   true,true,'footwear',ARRAY['running','knit','new-drop'],'{"color":"Black/White","sizes":["40","41","42","43","44","45"],"gender":"unisex"}'),

  ('Classic Low Sneaker','classic-low-sneaker','Minimal court style for daily wear.',
   'A clean low-top with a smooth upper, cushioned insole, padded collar, and durable rubber outsole. Pairs with denim, cargos, and joggers.',
   1599.00,1999.00,'AK-FW-002',45,'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=85',
   true,false,'footwear',ARRAY['lifestyle','classic','daily'],'{"color":"White","sizes":["39","40","41","42","43","44","45"],"gender":"unisex"}'),

  ('Urban Hiker Boot','urban-hiker-boot','Trail-ready ankle boot for city streets.',
   'A rugged ankle boot with a waterproof synthetic upper, padded collar, grippy lug outsole, and reinforced toe for wet streets and evening commutes.',
   2499.00,2999.00,'AK-FW-003',18,'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1200&q=85',
   false,true,'footwear',ARRAY['boots','waterproof','hiking'],'{"color":"Tan","sizes":["40","41","42","43","44","45","46"],"material":"synthetic leather"}'),

  ('Slide Pro','slide-pro','Contoured comfort for home and poolside.',
   'A cushioned slide with a contoured arch-support footbed, adjustable single strap, and textured rubber outsole for all-day comfort.',
   699.00,899.00,'AK-FW-004',60,'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=85',
   false,true,'footwear',ARRAY['slides','sandals','casual'],'{"color":"Black","sizes":["39","40","41","42","43","44"],"gender":"unisex"}'),

  -- SHIRTS
  ('Everyday Oversized Tee','everyday-oversized-tee','Heavy cotton relaxed-fit tee.',
   'Cut from substantial combed cotton with dropped shoulders, a ribbed crew neck, and double-stitched hems. A dependable base for every rotation.',
   549.00,699.00,'AK-SH-001',80,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85',
   true,true,'shirts',ARRAY['tshirt','cotton','oversized'],'{"color":"White","sizes":["XS","S","M","L","XL","XXL"],"material":"100% cotton","fit":"oversized"}'),

  ('Oxford Button-Up','oxford-button-up','Crisp cotton oxford for smart casual days.',
   'A versatile button-up in an oxford weave with a spread collar, chest pocket, and relaxed body that works from the office to the weekend.',
   1149.00,1399.00,'AK-SH-002',35,'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',
   true,false,'shirts',ARRAY['shirt','formal','oxford'],'{"color":"Light Blue","sizes":["S","M","L","XL","XXL"],"material":"cotton oxford","fit":"regular"}'),

  ('Graphic Print Tee','graphic-print-tee','Heavy cotton street graphic tee.',
   'A heavyweight tee with an original AK Drop graphic printed in water-based inks. Boxy fit, reinforced collar, and durable double-stitched construction.',
   649.00,799.00,'AK-SH-003',55,'https://images.unsplash.com/photo-1503341733017-1901578f9f1e?auto=format&fit=crop&w=1200&q=85',
   false,true,'shirts',ARRAY['tshirt','graphic','streetwear'],'{"color":"Black","sizes":["XS","S","M","L","XL","XXL"],"material":"heavy cotton","fit":"boxy"}'),

  ('Linen Camp Shirt','linen-camp-shirt','Breathable linen blend for warm days.',
   'A lightweight camp-collar shirt with an open hem, relaxed fit, and natural-finish buttons. Easy to wear alone or layered over a tee.',
   999.00,1249.00,'AK-SH-004',28,'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85',
   false,false,'shirts',ARRAY['shirt','linen','summer'],'{"color":"Sage Green","sizes":["S","M","L","XL"],"material":"linen blend","fit":"relaxed"}'),

  -- PANTS
  ('Slim Fit Chino','slim-fit-chino','Stretch cotton chino with a clean silhouette.',
   'Mid-weight stretch twill chino, slim through the thigh and tapered at the ankle. Flat-front construction makes it easy to dress up or down.',
   1299.00,1599.00,'AK-PT-001',40,'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85',
   true,false,'pants',ARRAY['chino','slim','smart-casual'],'{"color":"Khaki","sizes":["28","30","32","34","36"],"material":"stretch twill","fit":"slim"}'),

  ('Relaxed Cargo Pant','relaxed-cargo-pant','Utility cargo with six practical pockets.',
   'Durable ripstop cargos with bellows thigh pockets, adjustable hems, articulated knees, and a hidden drawstring for unrestricted movement.',
   1499.00,1799.00,'AK-PT-002',32,'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=1200&q=85',
   true,true,'pants',ARRAY['cargo','relaxed','utility'],'{"color":"Olive","sizes":["28","30","32","34","36","38"],"material":"ripstop cotton","fit":"relaxed"}'),

  ('Classic Straight Jeans','classic-straight-jeans','Medium-wash denim with a timeless straight cut.',
   'Stretch denim with classic five-pocket construction, subtle fade, and a straight leg that stacks cleanly on any shoe.',
   1799.00,2199.00,'AK-PT-003',25,'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85',
   false,false,'pants',ARRAY['jeans','denim','straight'],'{"color":"Medium Blue","sizes":["28","30","32","34","36"],"material":"stretch denim","fit":"straight"}'),

  ('Tapered Jogger','tapered-jogger','Soft French terry jogger for training and downtime.',
   'Garment-dyed French terry with tapered legs, ribbed ankle cuffs, elastic waistband, adjustable drawcord, and practical side pockets.',
   999.00,1199.00,'AK-PT-004',50,'https://images.unsplash.com/photo-1553830591-d8632a99e6ff?auto=format&fit=crop&w=1200&q=85',
   false,true,'pants',ARRAY['jogger','sweatpants','athletic'],'{"color":"Charcoal","sizes":["XS","S","M","L","XL","XXL"],"material":"french terry","fit":"tapered"}'),

  -- OUTERWEAR
  ('Heavyweight Zip Hoodie','heavyweight-zip-hoodie','420 GSM fleece zip hoodie.',
   'A premium brushed-fleece full-zip hoodie with a double-layered hood, ribbed cuffs, oversized fit, and structured kangaroo pockets.',
   1799.00,2199.00,'AK-OW-001',38,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85',
   true,true,'outerwear',ARRAY['hoodie','fleece','zip-up'],'{"color":"Black","sizes":["XS","S","M","L","XL","XXL"],"material":"420gsm fleece","fit":"oversized"}'),

  ('Technical Shell Jacket','technical-shell-jacket','Water-resistant shell for wind and rain.',
   'A lightweight technical shell with taped seams, adjustable cuffs and hem, breathable panels, underarm vents, and packable construction.',
   3499.00,4299.00,'AK-OW-002',15,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85',
   true,false,'outerwear',ARRAY['jacket','waterproof','technical'],'{"color":"Forest Green","sizes":["XS","S","M","L","XL","XXL"],"waterproof":"10000mm","fit":"regular"}'),

  ('Varsity Bomber Jacket','varsity-bomber-jacket','Classic varsity styling with a modern fit.',
   'A wool-blend bomber with contrast sleeves, ribbed collar and cuffs, quilted lining, interior pocket, and front slash pockets.',
   2799.00,3499.00,'AK-OW-003',20,'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1200&q=85',
   false,true,'outerwear',ARRAY['jacket','varsity','bomber'],'{"color":"Navy/White","sizes":["XS","S","M","L","XL","XXL"],"material":"wool blend","fit":"regular"}'),

  -- BAGS
  ('Urban Commuter Backpack','urban-commuter-backpack','20L laptop backpack with padded protection.',
   'A water-resistant commuter backpack with a 15-inch laptop sleeve, quick-access top pocket, bottle pockets, breathable back panel, and organized internal storage.',
   1999.00,2499.00,'AK-BG-001',22,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
   true,true,'bags',ARRAY['backpack','laptop','commute'],'{"color":"Black","capacity":"20L","laptop":"up to 15 inch","material":"600D polyester"}'),

  ('Crossbody Messenger Bag','crossbody-messenger-bag','Compact daily carry with smart organization.',
   'A slim crossbody messenger with adjustable strap, secure zip pocket, magnetic closure, organizer panel, and room for a tablet and daily essentials.',
   1199.00,1499.00,'AK-BG-002',30,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
   false,true,'bags',ARRAY['crossbody','messenger','daily'],'{"color":"Tan","capacity":"6L","material":"canvas","strap":"adjustable"}'),

  ('Weekender Duffel 40L','weekender-duffel-40l','Spacious travel duffel with shoe compartment.',
   'A roomy canvas duffel with a vented shoe compartment, padded handles, removable shoulder strap, and end pockets for quick-access items.',
   2299.00,2799.00,'AK-BG-003',14,'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=1200&q=85',
   true,false,'bags',ARRAY['duffel','travel','weekend'],'{"color":"Olive Canvas","capacity":"40L","material":"waxed canvas","shoe_compartment":true}'),

  -- ACCESSORIES
  ('Minimalist Steel Watch','minimalist-steel-watch','Japanese quartz watch with brushed steel case.',
   'A clean 40mm brushed-steel watch with a domed mineral crystal, Japanese quartz movement, steel bracelet, butterfly clasp, and 5ATM water resistance.',
   1599.00,1999.00,'AK-AC-001',20,'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85',
   true,false,'accessories',ARRAY['watch','steel','minimal'],'{"color":"Silver","diameter":"40mm","movement":"Japanese quartz","water_resistance":"5ATM"}'),

  ('Six-Panel Cotton Cap','six-panel-cotton-cap','Structured cap with embroidered AK Drop logo.',
   'A six-panel chino cotton cap with a pre-curved bill, embroidered front mark, breathable eyelets, and adjustable strapback closure.',
   499.00,649.00,'AK-AC-002',65,'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85',
   true,true,'accessories',ARRAY['cap','hat','streetwear'],'{"color":"Black","size":"adjustable","material":"chino cotton twill"}'),

  ('UV400 Wraparound Shades','uv400-wraparound-shades','Polarized lenses with full UV400 protection.',
   'Lightweight TR90 frames with polarized lenses, anti-reflective coating, spring hinges, and a semi-wrap silhouette for sport and street.',
   899.00,1199.00,'AK-AC-003',35,'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?auto=format&fit=crop&w=1200&q=85',
   false,true,'accessories',ARRAY['sunglasses','uv400','polarized'],'{"color":"Matte Black","lens":"polarized","uv_protection":"UV400","frame":"TR90"}'),

  -- ELECTRONICS
  ('True Wireless Earbuds','true-wireless-earbuds','ANC earbuds with 32-hour total battery life.',
   'Wireless earbuds with active noise cancellation, transparency mode, Bluetooth 5.3, multipoint pairing, IPX5 water resistance, and a compact charging case.',
   2499.00,3199.00,'AK-EL-001',25,'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
   true,true,'electronics',ARRAY['earbuds','anc','wireless'],'{"color":"Midnight Black","battery_buds":"8hr","battery_case":"24hr","anc":true,"ipx":"IPX5"}'),

  ('65W GaN USB-C Charger','65w-gan-usb-c-charger','Compact charger for laptops, phones, and tablets.',
   'A palm-sized GaN charger with 65W USB-C Power Delivery, an 18W USB-A port, foldable pins, universal voltage, and simultaneous dual-device charging.',
   899.00,1199.00,'AK-EL-002',50,'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=85',
   false,true,'electronics',ARRAY['charger','gan','usb-c'],'{"color":"White","wattage":"65W","ports":["USB-C 65W","USB-A 18W"],"voltage":"100-240V"}'),

  ('Portable Power Bank 20K','portable-power-bank-20k','20,000mAh battery with fast charging.',
   'A high-capacity lithium-polymer power bank with 22.5W USB-C in/out, 18W USB-A output, percentage display, and simultaneous charging for two devices.',
   1299.00,1699.00,'AK-EL-003',30,'https://images.unsplash.com/photo-1609592806596-b70f1f64e9b8?auto=format&fit=crop&w=1200&q=85',
   true,false,'electronics',ARRAY['powerbank','charging','portable'],'{"color":"Black","capacity":"20000mAh","max_output":"22.5W","ports":["USB-C","USB-A"]}'),

  -- SPORTS
  ('Pro Training Shorts','pro-training-shorts','Four-way stretch training shorts with liner.',
   'Moisture-wicking shorts with a built-in liner, side zip pocket, elastic waistband, drawcord, and a versatile seven-inch inseam for any training discipline.',
   799.00,999.00,'AK-SP-001',55,'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85',
   true,true,'sports',ARRAY['shorts','training','athletic'],'{"color":"Black","sizes":["XS","S","M","L","XL","XXL"],"inseam":"7 inch","material":"stretch polyester"}'),

  ('Compression Base Layer','compression-base-layer','Supportive moisture-managing training top.',
   'A close-fit compression long-sleeve with flatlock seams, UPF 50+ fabric, four-way stretch, and moisture transport for outdoor and indoor training.',
   999.00,1299.00,'AK-SP-002',40,'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
   false,true,'sports',ARRAY['compression','baselayer','training'],'{"color":"Charcoal","sizes":["XS","S","M","L","XL","XXL"],"material":"nylon/elastane","upf":"50+"}'),

  ('Gym Duffel 25L','gym-duffel-25l','Ventilated gym bag with wet/dry compartment.',
   'A practical gym duffel with vented shoe storage, main zip access, organizer pocket, padded handles, removable shoulder strap, and reflective details.',
   1499.00,1799.00,'AK-SP-003',22,'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=85',
   true,false,'sports',ARRAY['gym','bag','sports'],'{"color":"Black/Grey","capacity":"25L","wet_dry_compartment":true,"material":"polyester"}')

) AS p(name,slug,short_desc,description,price,compare_price,sku,qty,img,featured,new_arrival,cat_slug,tags,attrs)
JOIN public.categories c ON c.slug = p.cat_slug
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description       = EXCLUDED.description,
  price             = EXCLUDED.price,
  compare_price     = EXCLUDED.compare_price,
  quantity          = EXCLUDED.quantity,
  category_id       = EXCLUDED.category_id,
  images            = EXCLUDED.images,
  is_featured       = EXCLUDED.is_featured,
  is_new_arrival    = EXCLUDED.is_new_arrival,
  is_active         = true,
  tags              = EXCLUDED.tags,
  attributes        = EXCLUDED.attributes;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Verify
-- ─────────────────────────────────────────────────────────────────────────────
SELECT c.name AS category, COUNT(p.id) AS active_products
FROM public.categories c
LEFT JOIN public.products p ON p.category_id = c.id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.sort_order
ORDER BY c.sort_order;
