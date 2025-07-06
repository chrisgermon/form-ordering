-- This script removes the unused 'primary_color' column from the 'brands' table.
-- Run this once to clean up the database schema.
ALTER TABLE brands DROP COLUMN IF EXISTS primary_color;
