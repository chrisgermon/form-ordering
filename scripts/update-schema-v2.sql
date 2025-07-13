-- This script updates the database schema to support more form field types.
-- Run this script once.

-- Rename 'quantities' to 'options' for clarity
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='product_items' AND column_name='quantities') THEN
    ALTER TABLE product_items RENAME COLUMN quantities TO options;
  END IF;
END $$;

-- Add new columns to the product_items table
ALTER TABLE product_items ADD COLUMN IF NOT EXISTS field_type TEXT NOT NULL DEFAULT 'checkbox_group';
ALTER TABLE product_items ADD COLUMN IF NOT EXISTS placeholder TEXT;
ALTER TABLE product_items ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT false;

-- Update existing items to have a default field type if they don't have one
UPDATE product_items SET field_type = 'checkbox_group' WHERE field_type IS NULL;
