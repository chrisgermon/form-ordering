-- This script adds the missing 'ordered_by_email' column to the submissions table.
-- This will align the database schema with the application code's expectations.
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS ordered_by_email VARCHAR(255);
