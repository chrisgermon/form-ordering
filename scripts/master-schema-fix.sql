-- This is a comprehensive script to fix all known schema inconsistencies in the database.
-- It addresses issues in 'brands' and 'product_items' tables that can cause forms to break.
-- Run this script once from your Supabase SQL Editor.

DO $$
BEGIN
    RAISE NOTICE '--- Starting Master Schema Fix ---';

    -- Section 1: Correcting the 'brands' table
    RAISE NOTICE 'Step 1: Verifying `brands` table...';

    -- Handle 'email' vs 'emails' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
            ALTER TABLE brands RENAME COLUMN email TO emails;
            ALTER TABLE brands ALTER COLUMN emails TYPE TEXT[] USING ARRAY[emails];
            RAISE NOTICE 'Renamed `brands.email` to `emails` and converted to TEXT[].';
        ELSE
            ALTER TABLE brands DROP COLUMN email;
            RAISE NOTICE 'Dropped redundant `brands.email` column.';
        END IF;
    END IF;
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

    -- Ensure 'clinic_locations' column is JSONB
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE brands ALTER COLUMN clinic_locations SET DATA TYPE JSONB USING clinic_locations::jsonb;
    RAISE NOTICE '`brands` table verified.';

    -- Section 2: Correcting the 'product_items' table
    RAISE NOTICE 'Step 2: Verifying `product_items` table...';

    -- Handle 'quantities' vs 'options' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_items' AND column_name='quantities') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_items' AND column_name='options') THEN
            ALTER TABLE product_items RENAME COLUMN quantities TO options;
            RAISE NOTICE 'Renamed `product_items.quantities` to `options`.';
        ELSE
            ALTER TABLE product_items DROP COLUMN quantities;
            RAISE NOTICE 'Dropped redundant `product_items.quantities` column.';
        END IF;
    END IF;

    -- Ensure 'options' column exists and is of type JSONB
    ALTER TABLE product_items ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE product_items ALTER COLUMN options SET DATA TYPE JSONB USING options::jsonb;
    RAISE NOTICE '`product_items.options` column verified as JSONB.';

    -- Ensure other critical columns exist
    ALTER TABLE product_items ADD COLUMN IF NOT EXISTS field_type TEXT NOT NULL DEFAULT 'checkbox_group';
    ALTER TABLE product_items ADD COLUMN IF NOT EXISTS placeholder TEXT;
    ALTER TABLE product_items ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '`product_items` table verified.';

    RAISE NOTICE '--- Master Schema Fix Complete ---';
END;
$$;

-- Finally, force the API to reload its cache to recognize the changes.
NOTIFY pgrst, 'reload schema';
