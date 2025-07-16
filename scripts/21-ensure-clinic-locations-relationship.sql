-- This script ensures the 'clinic_locations' table and its relationship
-- with the 'brands' table are correctly set up. It is designed to be
-- idempotent and can be run safely multiple times. This is a critical
-- migration to fix issues with fetching brand data.

-- Step 1: Ensure the 'clinic_locations' table exists.
-- This table stores clinic locations in a structured, relational way,
-- replacing the old JSONB column on the 'brands' table.
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
-- This is a cleanup step to finalize the migration from a JSON-based
-- structure to a proper relational one.
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
        RAISE NOTICE 'Dropped column clinic_locations from brands table.';
    END IF;
END $$;

-- Step 4: Establish the foreign key relationship.
-- This is the most critical step. It tells Supabase/PostgREST how the
-- 'brands' and 'clinic_locations' tables are related, which is required
-- for nested queries to work.
-- We drop the constraint first to avoid errors if it already exists from a
-- previous attempt.
ALTER TABLE public.clinic_locations
DROP CONSTRAINT IF EXISTS clinic_locations_brand_id_fkey;

ALTER TABLE public.clinic_locations
ADD CONSTRAINT clinic_locations_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands (id)
ON DELETE CASCADE;

RAISE NOTICE 'Successfully created foreign key relationship between clinic_locations and brands.';

-- Step 5: Notify PostgREST to reload its schema cache.
-- This makes the new relationship available to the API immediately without
-- needing to restart the service.
NOTIFY pgrst, 'reload schema';

RAISE NOTICE 'PostgREST schema cache reload notified. The API should now recognize the relationship.';
