-- This script ensures the 'submissions' table has the required columns.
-- It is safe to run multiple times.

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS email_response TEXT;
