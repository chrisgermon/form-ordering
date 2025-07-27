-- This script forces a reload of the PostgREST schema cache.
-- It helps resolve errors like "Could not find a relationship between tables"
-- after a migration has been applied.
--
-- Run this script from the Supabase SQL Editor.
NOTIFY pgrst, 'reload schema';
