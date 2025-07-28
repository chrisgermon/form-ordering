-- This script corrects the schema for the 'product_items' table, which is likely causing form fields to not appear.
-- It ensures the 'options' column (used for checkboxes/selects) exists with the correct name and type.
-- Run this script once from your Supabase SQL Editor to fix all forms.

DO $$
BEGIN
    -- Step 1: Check if the legacy 'quantities' column exists.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_items' AND column_name='quantities') THEN
        -- If 'quantities' exists, check if the correct 'options' column also exists.
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_items' AND column_name='options') THEN
            -- If both exist, 'quantities' is a leftover and should be dropped.
            ALTER TABLE product_items DROP COLUMN quantities;
            RAISE NOTICE 'Dropped legacy column "quantities" from "product_items" table.';
        ELSE
            -- If 'quantities' exists but 'options' does not, rename 'quantities' to 'options'. This is the most likely fix.
            ALTER TABLE product_items RENAME COLUMN quantities TO options;
            RAISE NOTICE 'Renamed column "quantities" to "options" in "product_items" table.';
        END IF;
    END IF;

    -- Step 2: After handling the legacy column, ensure the 'options' column exists with the correct type (JSONB).
    -- This will add the column if it doesn't exist at all.
    ALTER TABLE product_items
    ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb;

    -- Step 3: Ensure the column type is JSONB. This handles cases where it might have been created as TEXT[].
    ALTER TABLE product_items
    ALTER COLUMN options SET DATA TYPE JSONB USING options::jsonb;

    RAISE NOTICE 'Schema for "product_items" table has been successfully verified and updated.';
END;
$$;

-- Step 4: After correcting the schema, force the API to reload its cache.
NOTIFY pgrst, 'reload schema';
