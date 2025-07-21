-- This script will permanently delete all data from the orders and order_items tables.
-- It uses TRUNCATE ... CASCADE to handle foreign key constraints correctly.

-- This will permanently delete all data from the orders table and any tables that reference it (like order_items).
TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;

-- The TRUNCATE command is used to quickly remove all records from a table.
-- RESTART IDENTITY resets the sequence that generates the primary key IDs.
-- CASCADE ensures that all referencing tables are also truncated.

-- Re-apply the default status for any new orders.
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'New'::text;

-- This ensures that any new orders created will have a default status of 'New'.
