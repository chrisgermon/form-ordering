-- This script permanently removes the legacy 'primary_color' column
-- and then forces the API to reload its schema cache.
-- This is designed to fix errors when updating brands.

-- Step 1: Drop the column if it exists.
ALTER TABLE brands DROP COLUMN IF EXISTS primary_color;

-- Step 2: Notify the PostgREST service to reload its schema.
NOTIFY pgrst, 'reload schema';
