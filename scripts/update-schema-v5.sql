-- This script adds a 'pathname' column to the 'uploaded_files' table
-- to support relative, domain-proxied file URLs.
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS pathname TEXT;

-- This will backfill the new 'pathname' column for existing files based on their current URL.
-- This assumes the URL format is https://[...].blob.vercel-storage.com/[pathname]
UPDATE uploaded_files
SET pathname = SUBSTRING(url FROM 'https://[^/]+/(.*)')
WHERE pathname IS NULL AND url LIKE 'https://%.blob.vercel-storage.com/%';
