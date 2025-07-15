-- Rename tables to their correct, simpler names
ALTER TABLE IF EXISTS product_sections RENAME TO sections;
ALTER TABLE IF EXISTS product_items RENAME TO items;
ALTER TABLE IF EXISTS uploaded_files RENAME TO files;

-- Rename columns to the standardized 'position'
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='sections' AND column_name='sort_order') THEN
    ALTER TABLE sections RENAME COLUMN sort_order TO position;
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='items' AND column_name='sort_order') THEN
    ALTER TABLE items RENAME COLUMN sort_order TO position;
  END IF;
END $$;

-- Ensure the 'logo' column exists on the brands table, not 'logo_url'
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='brands' AND column_name='logo_url') THEN
    ALTER TABLE brands RENAME COLUMN logo_url TO logo;
  END IF;
END $$;
