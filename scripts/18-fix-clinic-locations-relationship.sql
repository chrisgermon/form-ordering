-- This script establishes the foreign key relationship between the 'clinic_locations'
-- and 'brands' tables. This is required for Supabase to perform nested queries
-- that fetch a brand and all of its associated clinic locations.

-- Drop the constraint first if it exists to prevent errors on re-running the script.
ALTER TABLE public.clinic_locations
DROP CONSTRAINT IF EXISTS clinic_locations_brand_id_fkey;

-- Add the foreign key constraint.
-- This tells the database that 'clinic_locations.brand_id' references 'brands.id'.
-- ON DELETE CASCADE means that if a brand is deleted, all its associated locations
-- will also be deleted, maintaining data integrity.
ALTER TABLE public.clinic_locations
ADD CONSTRAINT clinic_locations_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands (id)
ON DELETE CASCADE;
