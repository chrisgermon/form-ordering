-- This script ensures the 'brands' table has the necessary columns for emails and clinic locations.
-- Run this script once to update your database schema.

ALTER TABLE brands
ADD COLUMN IF NOT EXISTS emails JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE brands
ADD COLUMN IF NOT EXISTS clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
