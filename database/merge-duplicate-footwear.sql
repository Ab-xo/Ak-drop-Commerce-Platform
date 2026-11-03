-- Merge duplicate Footwear categories into the canonical `footwear` category.
-- Safe to run repeatedly in the Supabase SQL Editor.

DO $$
DECLARE
  canonical_id UUID;
  duplicate_id UUID;
BEGIN
  SELECT id
  INTO canonical_id
  FROM public.categories
  WHERE slug = 'footwear'
  LIMIT 1;

  IF canonical_id IS NULL THEN
    SELECT id
    INTO canonical_id
    FROM public.categories
    WHERE lower(btrim(name)) = 'footwear' OR slug = 'shoes'
    ORDER BY (slug = 'shoes') DESC
    LIMIT 1;

    IF canonical_id IS NULL THEN
      RETURN;
    END IF;

    UPDATE public.categories
    SET name = 'Footwear', slug = 'footwear'
    WHERE id = canonical_id;
  ELSE
    UPDATE public.categories
    SET name = 'Footwear'
    WHERE id = canonical_id;
  END IF;

  FOR duplicate_id IN
    SELECT id
    FROM public.categories
    WHERE id <> canonical_id
      AND (lower(btrim(name)) = 'footwear' OR slug = 'shoes')
  LOOP
    UPDATE public.products
    SET category_id = canonical_id
    WHERE category_id = duplicate_id;

    DELETE FROM public.categories
    WHERE id = duplicate_id;
  END LOOP;
END
$$;
