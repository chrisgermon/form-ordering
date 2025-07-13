-- This script creates the 'options' table, migrates existing data from the 'items.options'
-- JSONB column, and then removes the old column to normalize the database schema.
-- This resolves "relation does not exist" errors and aligns the schema with the application code.

-- Step 1: Create the new 'options' table if it doesn't already exist.
-- This table will store selectable options for form items (e.g., dropdown choices).
CREATE TABLE IF NOT EXISTS public.options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    label TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_options_item_id ON public.options(item_id);
CREATE INDEX IF NOT EXISTS idx_options_brand_id ON public.options(brand_id);

-- Add a trigger to automatically update the 'updated_at' timestamp on changes.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_options_updated_at') THEN
   CREATE TRIGGER update_options_updated_at
   BEFORE UPDATE ON public.options
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF;
END;
$$;


-- Step 2: Migrate data from the old JSONB column to the new 'options' table.
-- This is wrapped in a block to check if the 'options' column exists before trying to migrate.
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='options') THEN
        -- This statement unnests the JSON array from each item and inserts each element as a new row in the 'options' table.
        INSERT INTO public.options (item_id, brand_id, value, label, sort_order)
        SELECT
            i.id AS item_id,
            i.brand_id AS brand_id,
            opt->>'value' AS value,
            opt->>'label' AS label,
            (ROW_NUMBER() OVER (PARTITION BY i.id ORDER BY 1)) - 1 AS sort_order
        FROM
            public.items i,
            jsonb_array_elements(i.options) WITH ORDINALITY arr(opt, rn)
        WHERE i.options IS NOT NULL AND jsonb_typeof(i.options) = 'array'
        ON CONFLICT DO NOTHING; -- Avoid errors if script is run multiple times
    END IF;
END $$;


-- Step 3: Drop the old JSONB column from the 'items' table now that data is migrated.
-- This is also wrapped to avoid errors if the column doesn't exist.
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='options') THEN
        ALTER TABLE public.items DROP COLUMN options;
    END IF;
END $$;

-- Notify PostgREST to reload the schema to recognize the changes.
NOTIFY pgrst, 'reload schema';
