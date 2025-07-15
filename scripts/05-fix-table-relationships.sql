-- This script ensures the correct foreign key relationships exist for our nested queries.

-- First, define the relationship between brands and sections.
-- This allows us to query for a brand and all its sections.
ALTER TABLE public.sections
DROP CONSTRAINT IF EXISTS sections_brand_id_fkey; -- Drop if it exists, to prevent errors

ALTER TABLE public.sections
ADD CONSTRAINT sections_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands (id)
ON DELETE CASCADE;


-- Second, define the relationship between sections and items.
-- This is the specific relationship that was causing the error.
ALTER TABLE public.items
DROP CONSTRAINT IF EXISTS items_section_id_fkey; -- Drop if it exists

ALTER TABLE public.items
ADD CONSTRAINT items_section_id_fkey
FOREIGN KEY (section_id)
REFERENCES public.sections (id)
ON DELETE CASCADE;


-- Finally, define the relationship between items and their options.
-- This is needed for checkbox and select fields.
ALTER TABLE public.options
DROP CONSTRAINT IF EXISTS options_item_id_fkey; -- Drop if it exists

ALTER TABLE public.options
ADD CONSTRAINT options_item_id_fkey
FOREIGN KEY (item_id)
REFERENCES public.items (id)
ON DELETE CASCADE;
