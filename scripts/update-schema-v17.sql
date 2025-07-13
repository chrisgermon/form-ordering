-- This script adds an 'order_prefix' column to the 'brands' table.
-- This prefix will be used when generating order numbers.
-- It is safe to run this script multiple times.

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS order_prefix TEXT;

-- Force schema reload for PostgREST to recognize the change immediately.
NOTIFY pgrst, 'reload schema';
