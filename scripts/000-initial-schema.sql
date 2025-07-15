-- This script sets up the entire database schema from scratch.
-- Running this will delete all existing data in these tables.
-- After running, you must re-seed the database from the admin dashboard.

-- Drop existing tables to ensure a clean slate
-- The CASCADE option will drop dependent objects like foreign keys and indexes.
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS product_items CASCADE;
DROP TABLE IF EXISTS product_sections CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS uploaded_files CASCADE;

-- Create brands table
-- This table stores information about each brand, like their name, logo, and contact email.
CREATE TABLE brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    primary_color TEXT DEFAULT 'blue-600',
    email TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE brands IS 'Stores information about each brand, like their name, logo, and contact email.';

-- Create product_sections table
-- Sections are used to group items on the order form (e.g., "Referrals", "Brochures").
CREATE TABLE product_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE product_sections IS 'Sections are used to group items on the order form (e.g., "Referrals", "Brochures").';


-- Create product_items table
-- These are the individual items that can be ordered.
CREATE TABLE product_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantities JSONB NOT NULL DEFAULT '[]',
    sample_link TEXT,
    section_id UUID REFERENCES product_sections(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE product_items IS 'These are the individual items that can be ordered.';


-- Create uploaded_files table
-- Stores metadata for files uploaded to the admin panel (e.g., logos, PDF samples).
CREATE TABLE uploaded_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    content_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE uploaded_files IS 'Stores metadata for files uploaded to the admin panel (e.g., logos, PDF samples).';


-- Create submissions table
-- This table logs every order submitted through the forms.
CREATE TABLE submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL, -- This is the foreign key relationship
    ordered_by TEXT NOT NULL,
    email TEXT NOT NULL,
    bill_to TEXT NOT NULL,
    deliver_to TEXT NOT NULL,
    order_date DATE,
    items JSONB NOT NULL DEFAULT '{}',
    pdf_url TEXT,
    ip_address TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE submissions IS 'This table logs every order submitted through the forms.';
COMMENT ON COLUMN submissions.brand_id IS 'Foreign key linking to the brands table. Set to NULL if the brand is deleted.';


-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_product_sections_brand_id ON product_sections(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_items_section_id ON product_items(section_id);
CREATE INDEX IF NOT EXISTS idx_product_items_brand_id ON product_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_filename ON uploaded_files(filename);
CREATE INDEX IF NOT EXISTS idx_submissions_brand_id ON submissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- Create function to update updated_at timestamp on any table that has it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at for each table
CREATE TRIGGER update_brands_updated_at 
  BEFORE UPDATE ON brands 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_sections_updated_at 
  BEFORE UPDATE ON product_sections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_items_updated_at 
  BEFORE UPDATE ON product_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at 
  BEFORE UPDATE ON submissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
