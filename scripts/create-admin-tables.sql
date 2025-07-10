-- Create brands table
CREATE TABLE brands (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
logo TEXT,
primary_color TEXT DEFAULT 'blue-600',
emails JSONB NOT NULL DEFAULT '[]'::jsonb,
clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
active BOOLEAN DEFAULT true,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_sections table
CREATE TABLE product_sections (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
title TEXT NOT NULL,
brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
sort_order INTEGER DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_items table
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

-- Create uploaded_files table
CREATE TABLE uploaded_files (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
filename TEXT NOT NULL,
original_name TEXT NOT NULL,
url TEXT NOT NULL,
size BIGINT NOT NULL,
content_type TEXT,
uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_sections_brand_id ON product_sections(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_items_section_id ON product_items(section_id);
CREATE INDEX IF NOT EXISTS idx_product_items_brand_id ON product_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_filename ON uploaded_files(filename);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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
