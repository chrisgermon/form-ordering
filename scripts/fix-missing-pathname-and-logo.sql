-- This script fixes two issues:
-- 1. It ensures the 'pathname' column exists on the 'uploaded_files' table.
-- 2. It adds the logo for Light Radiology and links it to the brand.
-- Run this script once from your Supabase SQL Editor.

-- Step 1: Add the 'pathname' column to the 'uploaded_files' table if it doesn't exist.
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS pathname TEXT;

-- Step 2: Backfill the new 'pathname' column for any existing files.
UPDATE public.uploaded_files
SET pathname = SUBSTRING(url FROM 'https://[^/]+/(.*)')
WHERE pathname IS NULL AND url LIKE 'https://%.blob.vercel-storage.com/%';

-- Step 3: Insert the file record for the Light Radiology logo.
-- The URL is a placeholder and will be replaced by the v0 environment with the actual blob URL.
INSERT INTO public.uploaded_files (pathname, original_name, url, content_type, size)
VALUES (
    'logos/light-radiology-logo.png',
    'light-radiology-logo.png',
    'https://[BLOB_URL_PLACEHOLDER]/logos/light-radiology-logo.png',
    'image/png',
    4635 -- Placeholder size
)
ON CONFLICT (pathname) DO UPDATE
SET
    url = EXCLUDED.url,
    original_name = EXCLUDED.original_name;

-- Step 4: Update the 'Light Radiology' brand to use this logo.
UPDATE public.brands
SET logo = 'logos/light-radiology-logo.png'
WHERE slug = 'light-radiology';

-- Step 5: Reload the schema cache to apply all changes immediately.
NOTIFY pgrst, 'reload schema';
