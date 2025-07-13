-- This script ensures the 'product_items' table has all the necessary columns for the form editor and Jotform import.
-- It is safe to run this script multiple times.

-- Add new columns to the product_items table if they don't exist
DO $$
BEGIN
  -- Rename 'quantities' to 'options' for clarity, if it exists
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='product_items' AND column_name='quantities') THEN
    ALTER TABLE product_items RENAME COLUMN quantities TO options;
  END IF;

  -- Ensure 'options' column exists
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='product_items' AND column_name='options') THEN
    ALTER TABLE product_items ADD COLUMN options JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  -- Add field_type column
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='product_items' AND column_name='field_type') THEN
    ALTER TABLE product_items ADD COLUMN field_type TEXT NOT NULL DEFAULT 'checkbox_group';
  END IF;
  
  -- Add placeholder column
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='product_items' AND column_name='placeholder') THEN
    ALTER TABLE product_items ADD COLUMN placeholder TEXT;
  END IF;

  -- Add is_required column
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='product_items' AND column_name='is_required') THEN
    ALTER TABLE product_items ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Update any existing items that might have a NULL field_type
UPDATE product_items SET field_type = 'checkbox_group' WHERE field_type IS NULL;
