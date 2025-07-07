-- Add a brand_id column to the uploaded_files table
-- This will link each file to a specific brand.
-- ON DELETE SET NULL means if a brand is deleted, the files will be kept but no longer linked to it.
ALTER TABLE uploaded_files
ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Add an index to improve query performance when filtering files by brand.
CREATE INDEX idx_uploaded_files_brand_id ON uploaded_files(brand_id);
