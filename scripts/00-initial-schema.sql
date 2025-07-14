-- This script sets up the initial database schema and seeds the core brands.
-- Run this script once in your Supabase SQL Editor to initialize the application.

-- 1. Create Tables

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name TEXT NOT NULL,
   slug TEXT UNIQUE NOT NULL,
   logo TEXT,
   emails TEXT[] NOT NULL DEFAULT '{}',
   clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
   active BOOLEAN DEFAULT true,
   created_at TIMESTAMPTZ DEFAULT now(),
   updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Sections Table
CREATE TABLE IF NOT EXISTS product_sections (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   title TEXT NOT NULL,
   sort_order INTEGER,
   brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
   created_at TIMESTAMPTZ DEFAULT now(),
   updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Items Table
CREATE TABLE IF NOT EXISTS product_items (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   code TEXT,
   name TEXT NOT NULL,
   description TEXT,
   field_type TEXT NOT NULL DEFAULT 'checkbox_group',
   options JSONB NOT NULL DEFAULT '[]'::jsonb,
   placeholder TEXT,
   is_required BOOLEAN NOT NULL DEFAULT false,
   sample_link TEXT,
   sort_order INTEGER,
   section_id UUID REFERENCES product_sections(id) ON DELETE CASCADE,
   brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
   created_at TIMESTAMPTZ DEFAULT now(),
   updated_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
   ordered_by TEXT,
   email TEXT,
   bill_to TEXT,
   deliver_to TEXT,
   items JSONB,
   pdf_url TEXT,
   status TEXT,
   email_response TEXT,
   order_data JSONB,
   ip_address TEXT,
   created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded Files Table
CREATE TABLE IF NOT EXISTS uploaded_files (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   filename TEXT NOT NULL,
   original_name TEXT NOT NULL,
   url TEXT NOT NULL,
   pathname TEXT,
   size BIGINT NOT NULL,
   content_type TEXT,
   brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
   uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for 'updated_at'
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_brands_updated_at') THEN
   CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_sections_updated_at') THEN
   CREATE TRIGGER update_product_sections_updated_at BEFORE UPDATE ON product_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_items_updated_at') THEN
   CREATE TRIGGER update_product_items_updated_at BEFORE UPDATE ON product_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;
END;
$$;

-- 2. Seed Initial Brands
-- This will insert the brands if they don't exist based on the unique slug.
INSERT INTO brands (name, slug, active, emails, clinic_locations) VALUES
('Vision Radiology', 'vision-radiology', true, '[]', '[]'),
('Light Radiology', 'light-radiology', true, '[]', '[]'),
('Quantum Medical Imaging', 'quantum-medical-imaging', true, '[]', '[]'),
('Focus Radiology', 'focus-radiology', true, '[]', '[]'),
('Pulse Radiology', 'pulse-radiology', true, '[]', '[]')
ON CONFLICT (slug) DO NOTHING;

-- 3. Force Schema Reload for PostgREST API
NOTIFY pgrst, 'reload schema';
