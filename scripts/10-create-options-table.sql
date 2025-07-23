-- This script creates the 'options' table, migrates existing data from the 'items.options'
-- JSONB column, and then removes the old column to normalize the database schema.
-- This resolves "relation does not exist" errors and aligns the schema with the application code.

-- Step 1: Create the new 'options' table if it doesn't already exist.
-- This table will store selectable options for form items (e.g., dropdown choices).
CREATE TABLE IF NOT EXISTS public.options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_options_item_id ON public.options(item_id);
CREATE INDEX IF NOT EXISTS idx_options_brand_id ON public.options(brand_id);

-- Add a trigger to automatically update the 'updated_at' timestamp on changes.
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp') THEN
   CREATE TRIGGER set_timestamp
   BEFORE UPDATE ON public.options
   FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
END IF;
END;
$$;


-- Step 2: Migrate data from the old JSONB column to the new 'options' table.
-- This is wrapped in a block to check if the 'options' column exists before trying to migrate.
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='options') THEN
        -- This statement unnests the JSON array from each item and inserts each element as a new row in the 'options' table.
        INSERT INTO public.options (item_id, label, value, sort_order)
        SELECT
            i.id AS item_id,
            opt->>'label' AS label,
            opt->>'value' AS value,
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
