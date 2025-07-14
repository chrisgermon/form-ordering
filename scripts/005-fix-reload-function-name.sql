-- This script corrects the name of the schema reload function.
-- The server action expects 'reload_schema_cache', but a previous script
-- may have created it with an incorrect name. This ensures the correct name is used.

-- Drop the old function if it exists to avoid conflicts.
DROP FUNCTION IF EXISTS reload_schema();

-- Create the function with the correct name that the server action calls.
CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with elevated privileges
AS $$
BEGIN
  -- This command notifies PostgREST to reload its schema cache.
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Grant execute permission to the 'service_role' so the server action can call it.
GRANT EXECUTE ON FUNCTION reload_schema_cache() TO service_role;

COMMENT ON FUNCTION reload_schema_cache() IS 'Triggers a PostgREST schema cache reload. Call this via RPC after database migrations.';
