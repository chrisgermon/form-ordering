-- Adds completion tracking fields to submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS expected_delivery DATE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS completion_notes TEXT;
