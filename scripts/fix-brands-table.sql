-- This script corrects the schema for the 'brands' table.
-- It removes a potentially incorrect 'email' column and ensures the 'emails' and 'clinic_locations' columns exist with the correct JSONB type.
-- Run this script once from the 'scripts' panel in the admin dashboard to fix the schema.

-- Drop the incorrect singular 'email' column if it exists.
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='brands' AND column_name='email') THEN
    ALTER TABLE brands DROP COLUMN email;
  END IF;
END $$;

-- Add the correct plural 'emails' column if it doesn't exist.
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS emails JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add the 'clinic_locations' column if it doesn't exist.
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
