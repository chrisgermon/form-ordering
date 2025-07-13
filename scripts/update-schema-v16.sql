-- This script corrects the data type of the 'order_number' column in the 'submissions' table.
-- It ensures the column is of type TEXT to accommodate formatted order numbers (e.g., PRN-FR-0006).
-- This is safe to run multiple times.

-- Add the column if it doesn't exist (for robustness)
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Alter the column type to TEXT. This will succeed if the column is an integer or text.
ALTER TABLE public.submissions
ALTER COLUMN order_number TYPE TEXT;

-- Force schema reload for PostgREST to recognize the change immediately.
NOTIFY pgrst, 'reload schema';
