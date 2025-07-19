-- This script will permanently delete all data from the submissions and submission_items tables.
-- It will also reset the auto-incrementing ID counters for these tables.

TRUNCATE TABLE
  public.submissions,
  public.submission_items
RESTART IDENTITY
CASCADE;

-- The TRUNCATE command is used to quickly remove all records from a table.
-- RESTART IDENTITY resets the sequence that generates the primary key IDs.
-- CASCADE ensures that any related data in tables with foreign keys (like submission_items) is also truncated.

ALTER TABLE public.submissions ALTER COLUMN status SET DEFAULT 'New'::text;

-- This ensures that any new submissions created will have a default status of 'New'.
