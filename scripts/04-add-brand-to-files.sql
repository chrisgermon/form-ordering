-- Add a column to link files to a specific brand
ALTER TABLE files
ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Add an index for faster lookups on brand_id
CREATE INDEX IF NOT EXISTS idx_files_brand_id ON files(brand_id);
