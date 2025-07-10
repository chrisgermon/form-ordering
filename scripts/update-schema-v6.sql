-- This script ensures the 'brands' table has a correctly named 'emails' column
-- and cleans up any old 'email_to' column that might be causing conflicts.

DO $$
BEGIN
    -- Check if the old 'email_to' column exists in the 'brands' table.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'email_to'
    ) THEN
        -- If 'email_to' exists, check if the correct 'emails' column also exists.
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'emails'
        ) THEN
            -- If both exist, the 'email_to' column is a leftover and should be dropped.
            ALTER TABLE brands DROP COLUMN email_to;
            RAISE NOTICE 'Dropped legacy column "email_to" from "brands" table.';
        ELSE
            -- If 'email_to' exists but 'emails' does not, rename 'email_to' to 'emails'.
            -- This preserves any data that might be in the old column.
            ALTER TABLE brands RENAME COLUMN email_to TO emails;
            RAISE NOTICE 'Renamed column "email_to" to "emails" in "brands" table.';
        END IF;
    END IF;

    -- After handling the potential old column, ensure the 'emails' column exists
    -- with the correct type (TEXT[]). This will add the column if it doesn't exist at all.
    ALTER TABLE brands
    ADD COLUMN IF NOT EXISTS emails TEXT[];

    RAISE NOTICE 'Schema for "brands" table has been successfully verified and updated.';
END;
$$;
