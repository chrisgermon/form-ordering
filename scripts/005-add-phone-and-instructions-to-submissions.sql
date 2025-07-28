-- Add phone and special_instructions columns to the submissions table
-- This allows storing additional order details submitted from the form.

-- Add 'phone' column to store the contact phone number of the person ordering.
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN submissions.phone IS 'Contact phone number for the order.';

-- Add 'special_instructions' column for any special notes or requests for the order.
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

COMMENT ON COLUMN submissions.special_instructions IS 'Special instructions or notes for the order.';
