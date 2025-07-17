-- Add the field_type column to the product_items table
-- This allows specifying different input types for form items (e.g., text, number, checkbox)
ALTER TABLE public.product_items
ADD COLUMN field_type TEXT NOT NULL DEFAULT 'text';

-- Backfill the `sort_order` for any null values to ensure consistent ordering
-- This prevents potential issues with items that were created before sort_order was added
UPDATE public.product_items
SET sort_order = 0
WHERE sort_order IS NULL;

-- Also ensure product_sections has a sort_order for consistency
UPDATE public.product_sections
SET sort_order = 0
WHERE sort_order IS NULL;

-- Add a comment to the new column for clarity in your database schema
COMMENT ON COLUMN public.product_items.field_type IS 'The type of form input to render for this item (e.g., text, number, checkbox).';
