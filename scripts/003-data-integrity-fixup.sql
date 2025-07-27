-- This script is designed to fix potential data inconsistencies.
-- It's safe to run multiple times and will not delete any submission data.

-- 1. Realign Item-to-Brand Relationships
-- Ensures every product_item has the same brand_id as its parent product_section.
-- This is the most critical fix to prevent items from appearing on the wrong order form.
DO $$
DECLARE
  updated_rows INT;
BEGIN
  RAISE NOTICE 'Step 1: Realigning item-to-brand relationships...';
  UPDATE product_items pi
  SET brand_id = ps.brand_id
  FROM product_sections ps
  WHERE pi.section_id = ps.id AND pi.brand_id IS DISTINCT FROM ps.brand_id;
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RAISE NOTICE '... % item(s) realigned.', updated_rows;
END $$;


-- 2. Clean Up Orphaned Sections
-- Deletes any product_sections that are linked to a non-existent brand.
-- The ON DELETE CASCADE constraint on product_items will automatically clean up their items.
DO $$
DECLARE
  deleted_rows INT;
BEGIN
  RAISE NOTICE 'Step 2: Cleaning up orphaned sections...';
  DELETE FROM product_sections
  WHERE brand_id NOT IN (SELECT id FROM brands);
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RAISE NOTICE '... % orphaned section(s) removed.', deleted_rows;
END $$;


-- 3. Ensure Default Values for Brands
-- Populates the 'clinics' list for any brand where it is NULL or an empty array.
DO $$
DECLARE
  updated_rows INT;
BEGIN
  RAISE NOTICE 'Step 3: Ensuring brands have a default clinics list...';
  UPDATE brands
  SET clinics = '["Botanic Ridge", "Bulleen", "Carnegie", "Coburg", "Diamond Creek", "Greensborough", "Hampton East", "Kangaroo Flat", "Kyabram", "Lilydale", "Lynbrook", "Mentone", "Mornington", "Mulgrave", "North Melbourne", "Reservoir", "Sebastopol", "Shepparton", "Thornbury", "Torquay", "Werribee", "Williamstown"]'::jsonb
  WHERE clinics IS NULL OR jsonb_array_length(clinics) = 0;
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RAISE NOTICE '... % brand(s) updated with default clinics.', updated_rows;
END $$;


-- 4. Ensure Default Values for Sections and Items
-- Sets a default sort_order of 0 and quantities of '[]' where they are NULL.
DO $$
DECLARE
  updated_sections INT;
  updated_items_sort INT;
  updated_items_qty INT;
BEGIN
  RAISE NOTICE 'Step 4: Setting default sort_order and quantities...';
  UPDATE product_sections SET sort_order = 0 WHERE sort_order IS NULL;
  GET DIAGNOSTICS updated_sections = ROW_COUNT;
  
  UPDATE product_items SET sort_order = 0 WHERE sort_order IS NULL;
  GET DIAGNOSTICS updated_items_sort = ROW_COUNT;

  UPDATE product_items SET quantities = '[]'::jsonb WHERE quantities IS NULL;
  GET DIAGNOSTICS updated_items_qty = ROW_COUNT;

  RAISE NOTICE '... % section(s) and % item(s) updated.', updated_sections, updated_items_sort;
  RAISE NOTICE '... % item(s) had quantities reset to default.', updated_items_qty;
END $$;
