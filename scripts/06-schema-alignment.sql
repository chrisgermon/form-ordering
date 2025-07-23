-- Add ordered_by_email to submissions
ALTER TABLE submissions ADD COLUMN ordered_by_email VARCHAR(255);

-- Add pdf_url to submissions
ALTER TABLE submissions ADD COLUMN pdf_url TEXT;

-- Add a status to submissions, e.g., 'pending', 'processed', 'archived'
ALTER TABLE submissions ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
