-- This script standardizes table names and ensures all foreign key relationships
-- are correctly defined to resolve nested query errors in the form editor.

-- Step 1: Standardize table name to 'items' from 'form_items' if it exists.
-- This ensures consistency with the application code.
ALTER TABLE IF EXISTS form_items RENAME TO items;

-- Step 2: Ensure the foreign key from 'sections' to 'brands' is correct.
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_brand_id_fkey;
ALTER TABLE public.sections
ADD CONSTRAINT sections_brand_id_fkey
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- Step 3: Fix the relationship between 'sections' and 'items'.
-- This is the source of the first error.
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_section_id_fkey;
ALTER TABLE public.items
ADD CONSTRAINT items_section_id_fkey
FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;

-- Step 4: Fix the relationship between 'items' and 'options'.
-- This is the source of the second error.
ALTER TABLE public.options DROP CONSTRAINT IF EXISTS options_item_id_fkey;
ALTER TABLE public.options
ADD CONSTRAINT options_item_id_fkey
FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;
