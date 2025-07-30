-- Add new columns to the submissions table for tracking completion details.
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS delivery_details TEXT,
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_by TEXT;

-- Update comments for clarity
COMMENT ON COLUMN submissions.status IS 'The status of the order (e.g., pending, sent, failed, completed).';
COMMENT ON COLUMN submissions.delivery_details IS 'Tracking number, courier, or other delivery information.';
COMMENT ON COLUMN submissions.expected_delivery_date IS 'The estimated date of delivery.';
COMMENT ON COLUMN submissions.completed_at IS 'Timestamp of when the order was marked as complete.';
COMMENT ON COLUMN submissions.completed_by IS 'Identifier for the user who marked the order as complete.';

-- Add an index on the status column for faster filtering
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
