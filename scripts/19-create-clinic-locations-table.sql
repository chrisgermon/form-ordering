-- This script corrects the database schema by creating a dedicated 'clinic_locations' table
-- and establishing a proper one-to-many relationship with the 'brands' table.
-- It replaces the previous approach of storing clinic locations as a JSONB object
-- inside the 'brands' table.

-- Step 1: Create the new 'clinic_locations' table if it doesn't already exist.
CREATE TABLE IF NOT EXISTS public.clinic_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Add the foreign key constraint to link it to the 'brands' table.
-- This ensures data integrity and allows for nested queries.
-- We add a check to avoid errors if the script is run multiple times.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'clinic_locations_brand_id_fkey' AND conrelid = 'public.clinic_locations'::regclass
    ) THEN
        ALTER TABLE public.clinic_locations
        ADD CONSTRAINT clinic_locations_brand_id_fkey
        FOREIGN KEY (brand_id)
        REFERENCES public.brands (id)
        ON DELETE CASCADE;
    END IF;
END;
$$;

-- Step 3: Drop the old 'clinic_locations' JSONB column from the 'brands' table.
-- This removes the redundant and confusing column, cleaning up the schema.
-- We add a check to ensure the column exists before trying to drop it.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'brands'
        AND column_name = 'clinic_locations'
    ) THEN
        ALTER TABLE public.brands
        DROP COLUMN clinic_locations;
    END IF;
END;
$$;

-- Step 4: Force schema reload for PostgREST API to recognize the changes.
NOTIFY pgrst, 'reload schema';
