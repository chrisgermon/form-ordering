-- This script corrects the schema for the 'brands' table to match the application code.
-- It handles multiple possible incorrect states and ensures the final schema is correct.
-- It is safe to run this script multiple times.

DO $$
BEGIN
    -- Step 1: Handle the 'email' vs 'emails' column.
    -- If the incorrect singular 'email' column exists...
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email') THEN
        -- ...and the correct plural 'emails' column does NOT exist...
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
            -- ...rename 'email' to 'emails' and change its type to TEXT[].
            RAISE NOTICE 'Renaming column "email" to "emails" and converting to TEXT[].';
            ALTER TABLE brands RENAME COLUMN email TO emails;
            -- The data in a single TEXT column will be cast to a single-element array.
            ALTER TABLE brands ALTER COLUMN emails TYPE TEXT[] USING ARRAY[emails];
        ELSE
            -- ...but if 'emails' already exists, just drop the incorrect 'email' column.
            RAISE NOTICE 'Dropping redundant "email" column.';
            ALTER TABLE brands DROP COLUMN email;
        END IF;
    END IF;

    -- Step 2: Ensure 'emails' column exists as TEXT[] if it wasn't created in step 1.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
        RAISE NOTICE 'Adding "emails" column with type TEXT[].';
        ALTER TABLE brands ADD COLUMN emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Step 3: Ensure 'clinic_locations' column exists as JSONB.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='clinic_locations') THEN
        RAISE NOTICE 'Adding "clinic_locations" column with type JSONB.';
        ALTER TABLE brands ADD COLUMN clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;

    -- Step 4: Drop legacy 'email_to' column if it exists.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email_to') THEN
        RAISE NOTICE 'Dropping legacy "email_to" column.';
        ALTER TABLE brands DROP COLUMN email_to;
    END IF;

    -- Step 5: Ensure 'primary_color' column exists as TEXT.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='primary_color') THEN
        RAISE NOTICE 'Adding "primary_color" column with type TEXT.';
        ALTER TABLE brands ADD COLUMN primary_color TEXT DEFAULT 'blue-600';
    END IF;

    RAISE NOTICE 'Brands table schema correction complete.';
END;
$$;

-- After correcting the schema, force the API to reload its cache.
NOTIFY pgrst, 'reload schema';
