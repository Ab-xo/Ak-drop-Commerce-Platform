-- AK Drop catalog expansion
-- Run after ecommerce-schema.sql. Safe to run repeatedly.

INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order) VALUES
  ('Running', 'running', 'Performance footwear for everyday training and long runs.', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85', true, 1),
  ('Lifestyle', 'lifestyle', 'Everyday sneakers designed for comfort and street style.', 'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=85', true, 2),
  ('Streetwear', 'streetwear', 'Relaxed essentials and statement pieces for the city.', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85', true, 3),
  ('Bags', 'bags', 'Functional bags made for commutes, weekends, and travel.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', true, 4)
ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url, description = EXCLUDED.description;

INSERT INTO public.products
  (name, slug, description, short_description, price, compare_price, sku, quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
SELECT v.name, v.slug, v.description, v.short_description, v.price, v.compare_price, v.sku, v.quantity, c.id,
       jsonb_build_array(v.image_url), v.is_featured, v.is_new_arrival, true, v.tags, v.attributes::jsonb
FROM (VALUES
  ('Aero Run X1', 'aero-run-x1', 'A lightweight daily trainer with responsive cushioning, breathable mesh, and a durable rubber outsole for city miles.', 'Lightweight cushioning for every run.', 139.00, 159.00, 'AK-RUN-X1-BLK', 24, 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85', true, true, ARRAY['running','new-drop','performance'], '{"color":"Obsidian","sizes":["40","41","42","43","44"],"fit":"true-to-size"}'),
  ('Cloud Pace Knit', 'cloud-pace-knit', 'A flexible knit upper and soft foam midsole create a smooth, comfortable ride for training days and daily movement.', 'Soft knit comfort with a smooth ride.', 119.00, 139.00, 'AK-RUN-CPK-WHT', 18, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', false, true, ARRAY['running','knit','comfort'], '{"color":"Cloud White","sizes":["39","40","41","42","43"],"fit":"true-to-size"}'),
  ('Metro Court Low', 'metro-court-low', 'A clean low-top silhouette with padded support and a versatile finish that moves from the sidewalk to the weekend.', 'The everyday low-top made for the city.', 109.00, 129.00, 'AK-LIFE-MCL-CRM', 31, 'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=85', true, false, ARRAY['lifestyle','low-top','daily'], '{"color":"Cream","sizes":["40","41","42","43","44"],"fit":"true-to-size"}'),
  ('Afterdark High', 'afterdark-high', 'A bold high-top with reinforced panels, cushioned ankle support, and a monochrome finish for after-hours styling.', 'A bold high-top for after-dark fits.', 149.00, 179.00, 'AK-LIFE-ADH-BLK', 15, 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=85', false, true, ARRAY['lifestyle','high-top','street'], '{"color":"Black","sizes":["40","41","42","43","44","45"],"fit":"slightly-roomy"}'),
  ('Everyday Heavy Tee', 'everyday-heavy-tee', 'A structured cotton tee with a relaxed fit, reinforced collar, and minimal AK Drop chest mark.', 'A heavyweight cotton essential.', 39.00, 49.00, 'AK-STW-EHT-SND', 40, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85', true, true, ARRAY['streetwear','tee','cotton'], '{"color":"Sand","sizes":["S","M","L","XL"],"material":"100% cotton"}'),
  ('Transit Crossbody', 'transit-crossbody', 'A compact crossbody built with durable fabric, secure zip storage, and an adjustable strap for daily carry.', 'Compact storage for the daily commute.', 59.00, 69.00, 'AK-BAG-TCB-OLV', 22, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', false, true, ARRAY['bags','crossbody','travel'], '{"color":"Olive","capacity":"3L","material":"recycled nylon"}')
) AS v(name, slug, description, short_description, price, compare_price, sku, quantity, image_url, is_featured, is_new_arrival, tags, attributes)
JOIN public.categories c ON c.slug = CASE
  WHEN v.slug LIKE 'aero-%' OR v.slug LIKE 'cloud-%' THEN 'running'
  WHEN v.slug LIKE 'metro-%' OR v.slug LIKE 'afterdark-%' THEN 'lifestyle'
  WHEN v.slug LIKE 'everyday-%' THEN 'streetwear'
  ELSE 'bags'
END
ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, short_description = EXCLUDED.short_description, price = EXCLUDED.price, compare_price = EXCLUDED.compare_price, quantity = EXCLUDED.quantity, images = EXCLUDED.images, is_featured = EXCLUDED.is_featured, is_new_arrival = EXCLUDED.is_new_arrival, tags = EXCLUDED.tags, attributes = EXCLUDED.attributes;
