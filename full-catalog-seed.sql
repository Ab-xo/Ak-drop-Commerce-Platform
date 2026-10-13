-- ============================================================================
-- AK ECOMMERCE — Full Multi-Category Catalog Seed
-- Run this in Supabase SQL Editor to populate all categories and products.
-- Safe to re-run: uses ON CONFLICT DO UPDATE.
-- ============================================================================

-- ─────────────────────────────────────────────
-- STEP 1: Ensure all required columns exist
-- ─────────────────────────────────────────────
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT TRUE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order  INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url   TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active      BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured    BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_price  DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity       INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images         JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags           TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS attributes     JSONB DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku            TEXT;

-- ─────────────────────────────────────────────
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
