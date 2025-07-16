-- This script ensures the foreign key relationship between 'brands' and 'sections'
-- is correctly defined and forces the API schema cache to reload.
-- This will fix errors related to nested queries.

-- 1. Drop the constraint if it exists to ensure a clean re-creation.
ALTER TABLE public.sections
DROP CONSTRAINT IF EXISTS sections_brand_id_fkey;

-- 2. Add the foreign key constraint. This tells Supabase that each section
-- belongs to a brand.
ALTER TABLE public.sections
ADD CONSTRAINT sections_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands (id)
ON DELETE CASCADE;

-- 3. IMPORTANT: Force the PostgREST schema cache to be reloaded.
-- This makes the API aware of the relationship change immediately.
NOTIFY pgrst, 'reload schema';

-- Log a success message in the Supabase SQL Editor output.
SELECT 'Successfully ensured brand-section relationship and reloaded schema cache.';
