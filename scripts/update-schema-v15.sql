-- This script adds the 'order_number' column to the 'submissions' table.
-- It is safe to run multiple times.
-- The column type is TEXT to accommodate formatted order numbers (e.g., PRN-VR-0001).

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Force schema reload for PostgREST to recognize the new column immediately.
NOTIFY pgrst, 'reload schema';
