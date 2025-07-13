-- This script ensures that the primary key 'id' columns on key tables
-- have a default value generator. This fixes "violates not-null constraint"
-- errors when inserting new rows for sections, items, or options.
-- This is the definitive fix for the "Save Changes" functionality in the editor.

-- Set default UUID for the 'sections' table
-- This command will succeed if the column is of type UUID and has no default,
-- or it will replace an existing incorrect default.
ALTER TABLE public.sections ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Set default UUID for the 'items' table
ALTER TABLE public.items ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Set default UUID for the 'options' table
ALTER TABLE public.options ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Notify PostgREST to reload the schema to recognize the changes.
NOTIFY pgrst, 'reload schema';
