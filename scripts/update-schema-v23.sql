ALTER TABLE submissions
ADD COLUMN dispatch_date TIMESTAMPTZ,
ADD COLUMN tracking_link TEXT,
ADD COLUMN dispatch_notes TEXT;

ALTER TABLE submissions
ALTER COLUMN status SET DEFAULT 'pending';
