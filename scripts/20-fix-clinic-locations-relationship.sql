-- This script ensures the 'clinic_locations' table and its relationship
-- with the 'brands' table are correctly set up. It's designed to be
-- idempotent and can be run safely multiple times.

-- Step 1: Create the 'clinic_locations' table if it doesn't exist.
-- This table stores clinic locations in a structured, relational way.
CREATE TABLE IF NOT EXISTS public.clinic_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL, -- This will be the foreign key to the brands table
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Add an index on 'brand_id' for faster lookups if it doesn't exist.
CREATE INDEX IF NOT EXISTS idx_clinic_locations_brand_id ON public.clinic_locations(brand_id);

-- Step 3: Remove the old JSONB column from the 'brands' table if it exists.
-- This completes the migration from a JSON-based structure to a relational one.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'brands'
        AND column_name = 'clinic_locations'
    ) THEN
        ALTER TABLE public.brands DROP COLUMN clinic_locations;
    END IF;
END $$;

-- Step 4: Establish the foreign key relationship.
-- This is crucial for Supabase to perform nested queries.
-- We drop it first to avoid errors if it already exists.
ALTER TABLE public.clinic_locations
DROP CONSTRAINT IF EXISTS clinic_locations_brand_id_fkey;

ALTER TABLE public.clinic_locations
ADD CONSTRAINT clinic_locations_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands (id)
ON DELETE CASCADE;

-- Step 5: Notify PostgREST to reload its schema cache.
-- This makes the new relationship available to the API immediately.
NOTIFY pgrst, 'reload schema';
