-- This script updates the 'Focus Radiology' brand with its logo
-- and some sample clinic locations for the order form dropdowns.

UPDATE brands
SET
  logo = '/images/focus-radiology-logo.png',
  clinic_locations = '[
    {"name": "Focus Radiology - Central", "address": "123 Medical Ave, Suite 100, Metro City", "phone": "(02) 9123 4567"},
    {"name": "Focus Radiology - North", "address": "456 Health St, Northtown", "phone": "(02) 9876 5432"},
    {"name": "Focus Radiology - West", "address": "789 Wellness Blvd, Westgate", "phone": "(02) 9555 8888"}
  ]'::jsonb,
  emails = '["orders@focusradiology.com.au"]'::text[]
WHERE
  slug = 'focus-radiology';

-- Force Schema Reload for PostgREST API
NOTIFY pgrst, 'reload schema';
