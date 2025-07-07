CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    brand_slug TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    images JSONB,
    CONSTRAINT fk_brand_slug
        FOREIGN KEY(brand_slug)
        REFERENCES brands(slug)
        ON DELETE CASCADE
);
