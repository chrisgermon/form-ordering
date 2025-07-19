-- This script corrects the previous attempt to clear submissions.
-- It targets only the 'submissions' table, as 'submission_items' does not exist in the current schema.

-- This will permanently delete all data from the submissions table.
TRUNCATE TABLE public.submissions RESTART IDENTITY;

-- The TRUNCATE command is used to quickly remove all records from a table.
-- RESTART IDENTITY resets the sequence that generates the primary key IDs.

-- Re-apply the default status for any new submissions.
ALTER TABLE public.submissions ALTER COLUMN status SET DEFAULT 'New'::text;
