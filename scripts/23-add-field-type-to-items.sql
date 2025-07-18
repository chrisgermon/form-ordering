ALTER TABLE public.product_items
ADD COLUMN IF NOT EXISTS field_type VARCHAR(255) NOT NULL DEFAULT 'text';

COMMENT ON COLUMN public.product_items.field_type IS 'The type of form field to render (e.g., text, number, checkbox, select).';
