-- This script ensures all necessary columns for order completion exist on the 'submissions' table.
-- It is safe to run multiple times.

-- Add completion tracking columns if they don't exist
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS delivery_details TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS completed_by TEXT;

-- Add an index on the status column for faster filtering if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_class c
        JOIN   pg_namespace n ON n.oid = c.relnamespace
        WHERE  c.relname = 'idx_submissions_status'
        AND    n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_submissions_status ON public.submissions(status);
    END IF;
END$$;

-- Update comments for clarity
COMMENT ON COLUMN public.submissions.status IS 'The status of the order (e.g., pending, sent, failed, completed).';
COMMENT ON COLUMN public.submissions.delivery_details IS 'Tracking number, courier, or other delivery information.';
COMMENT ON COLUMN public.submissions.expected_delivery_date IS 'The estimated date of delivery.';
COMMENT ON COLUMN public.submissions.completed_at IS 'Timestamp of when the order was marked as complete.';
COMMENT ON COLUMN public.submissions.completed_by IS 'Identifier for the user who marked the order as complete.';
