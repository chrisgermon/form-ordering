-- This script ensures the foreign key relationship between 'form_submissions' and 'brands' is correctly established.

-- Step 1: Add the 'brand_id' column to 'form_submissions' if it doesn't already exist.
-- This is a safeguard in case the column was missed in previous migrations.
ALTER TABLE public.form_submissions
ADD COLUMN IF NOT EXISTS brand_id UUID;

-- Step 2: Drop the foreign key constraint if it already exists.
-- This makes the script safe to re-run without causing errors.
ALTER TABLE public.form_submissions
DROP CONSTRAINT IF EXISTS form_submissions_brand_id_fkey;

-- Step 3: Add the foreign key constraint.
-- This creates the relationship that Supabase uses for nested queries.
-- It links the 'brand_id' in this table to the 'id' in the 'brands' table.
-- ON DELETE SET NULL means if a brand is deleted, the submission record will remain but its brand_id will be cleared.
ALTER TABLE public.form_submissions
ADD CONSTRAINT form_submissions_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands(id)
ON DELETE SET NULL;

-- Step 4: Create an index on the new foreign key column.
-- This is a performance best practice and will speed up queries that join or filter on brand_id.
CREATE INDEX IF NOT EXISTS idx_form_submissions_brand_id ON public.form_submissions(brand_id);

-- Step 5: Notify PostgREST to reload its schema cache.
-- This is crucial for the changes to be recognized by the API immediately.
NOTIFY pgrst, 'reload schema';
