-- This script adds brand_id to uploaded_files to scope them to a brand.
-- It is safe to run multiple times.
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_uploaded_files_brand_id ON uploaded_files(brand_id);
