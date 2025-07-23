-- Add 'emails' column to brands table
ALTER TABLE brands
ADD COLUMN emails TEXT[];

-- Update Focus Radiology with their email
UPDATE brands
SET emails = ARRAY['chris@focusradiology.com.au']
WHERE slug = 'focus-radiology';
