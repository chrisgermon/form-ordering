-- This script ensures the 'submissions' table has all the necessary columns
-- for storing order data, PDF URLs, and email status.
-- It uses 'ADD COLUMN IF NOT EXISTS' to be safe to run multiple times.

-- Add a column to store the full order payload as a JSONB object.
-- This is more flexible than having many individual columns.
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS order_data JSONB;

-- Add a column to store the status of the order submission (e.g., 'sent', 'failed').
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS status TEXT;

-- Add a column to store the response message from the email service.
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS email_response TEXT;

-- Add a column to store the public URL of the generated PDF stored in Vercel Blob.
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS pdf_url TEXT;
