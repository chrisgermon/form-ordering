-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Sections Table
CREATE TABLE IF NOT EXISTS product_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    sort_order INTEGER,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Items Table
CREATE TABLE IF NOT EXISTS product_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    field_type TEXT NOT NULL,
    options TEXT[],
    placeholder TEXT,
    is_required BOOLEAN DEFAULT false,
    sample_link TEXT,
    sort_order INTEGER,
    section_id UUID REFERENCES product_sections(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
