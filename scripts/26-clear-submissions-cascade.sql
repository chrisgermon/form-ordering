-- This script corrects the previous attempt to clear submissions.
-- It uses TRUNCATE ... CASCADE to handle foreign key constraints.
-- This will delete all data from 'submissions' and any tables that reference it (like 'submission_items').

-- This will permanently delete all data from the submissions table and related tables.
TRUNCATE TABLE public.submissions RESTART IDENTITY CASCADE;

-- The TRUNCATE command is used to quickly remove all records from a table.
-- RESTART IDENTITY resets the sequence that generates the primary key IDs.
-- CASCADE ensures that all referencing tables are also truncated.

-- Re-apply the default status for any new submissions.
ALTER TABLE public.submissions ALTER COLUMN status SET DEFAULT 'New'::text;
