-- This script adds a 'completed_at' timestamp to the 'submissions' table.
-- This allows tracking when an order was marked as complete.
-- It is safe to run this script multiple times.

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add a comment to clarify the possible values for the status column.
COMMENT ON COLUMN public.submissions.status IS 'The status of the submission (e.g., sent, failed, completed)';
