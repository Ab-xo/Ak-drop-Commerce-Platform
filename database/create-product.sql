-- AK DROP — UPDATE THE EXISTING URBAN COMMUTER BACKPACK GALLERY
-- This updates the existing AK-BG-001 product; it does not insert a duplicate.
-- The four distinct Unsplash image URLs were checked and returned image/jpeg.
-- Product prices remain stored in ETB; storefront display/test checkout uses
-- the project's illustrative USD conversion rate.

DO $$
DECLARE
    v_sku CONSTANT TEXT := 'AK-BG-001';
    v_name CONSTANT TEXT := 'Urban Commuter Backpack';
    v_slug CONSTANT TEXT := 'urban-commuter-backpack';
    v_description CONSTANT TEXT := 'A streamlined everyday backpack designed for commuting and daily carry.';
    v_short_description CONSTANT TEXT := 'A clean, versatile backpack for everyday carry.';
    v_category_slug CONSTANT TEXT := 'bags';
    v_price_etb CONSTANT NUMERIC(10,2) := 1999.00;
    v_images CONSTANT TEXT[] := ARRAY[
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=1200&q=85'
    ];
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    IF cardinality(v_images) <> 4
       OR (SELECT COUNT(DISTINCT image) FROM unnest(v_images) AS image_rows(image)) <> 4
       OR EXISTS (
           SELECT 1
           FROM unnest(v_images) AS image_rows(image)
           WHERE image IS NULL
              OR btrim(image) = ''
              OR lower(btrim(image)) NOT LIKE 'https://%'
       ) THEN
        RAISE EXCEPTION 'The backpack gallery must contain four distinct public HTTPS image URLs.';
    END IF;

    SELECT id
    INTO v_category_id
    FROM public.categories
    WHERE slug = v_category_slug
      AND is_active = TRUE
    LIMIT 1;

    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'No active category found with slug "%".', v_category_slug;
    END IF;

    SELECT id
    INTO v_product_id
    FROM public.products
    WHERE sku = v_sku;

    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Existing backpack with SKU "%" was not found; no product was inserted.', v_sku;
    END IF;

    UPDATE public.products
    SET name = v_name,
        slug = v_slug,
        description = v_description,
        short_description = v_short_description,
        price = v_price_etb,
        category_id = v_category_id,
        images = to_jsonb(v_images),
        updated_at = NOW()
    WHERE id = v_product_id;

    RAISE NOTICE 'Updated "%" (SKU %) with four gallery images.', v_name, v_sku;
END;
$$;
