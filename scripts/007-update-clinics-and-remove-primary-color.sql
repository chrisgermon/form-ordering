-- Step 1: Remove the primary_color column if it exists.
ALTER TABLE public.brands
DROP COLUMN IF EXISTS primary_color;

-- Step 2: Add a temporary column to hold the new JSONB data.
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS clinics_data jsonb;

-- Step 3: Migrate data from the old text array to the new JSONB format.
-- This script converts each clinic name into an object with a name and an empty address.
-- It only runs if the clinics_data column is empty and the old clinics column exists and is not empty.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='brands' AND column_name='clinics' AND udt_name='_text'
    ) AND (SELECT count(*) FROM brands WHERE clinics_data IS NULL AND clinics IS NOT NULL AND array_length(clinics, 1) > 0) > 0 THEN
        UPDATE public.brands
        SET clinics_data = (
            SELECT jsonb_agg(jsonb_build_object('name', clinic_name, 'address', ''))
            FROM unnest(clinics) as clinic_name
        )
        WHERE clinics IS NOT NULL AND array_length(clinics, 1) > 0;
    END IF;
END $$;

-- Step 4: Drop the old clinics column.
ALTER TABLE public.brands
DROP COLUMN IF EXISTS clinics;

-- Step 5: Rename the new column to 'clinics'.
ALTER TABLE public.brands
RENAME COLUMN clinics_data TO clinics;

-- Step 6: Ensure the clinics column has a default value of an empty JSON array.
ALTER TABLE public.brands
ALTER COLUMN clinics SET DEFAULT '[]'::jsonb;
