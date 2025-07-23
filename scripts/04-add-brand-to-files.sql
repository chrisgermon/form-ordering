-- Add brand_id to files table
ALTER TABLE files ADD COLUMN brand_id UUID;

-- Add foreign key constraint
ALTER TABLE files ADD CONSTRAINT fk_brand
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX idx_files_brand_id ON files(brand_id);
