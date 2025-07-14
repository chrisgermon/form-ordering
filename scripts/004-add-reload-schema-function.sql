-- Creates a function that can be called via RPC to reload the PostgREST schema cache.
-- This is useful after making database changes to ensure the API layer sees them.
-- NOTE: This function should only be callable by authenticated admin users in a real application.
CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Allows the function to run with elevated privileges
AS $$
BEGIN
  -- This command notifies PostgREST to reload its schema cache.
  NOTIFY pgrst, 'reload schema';
END;
$$;

COMMENT ON FUNCTION reload_schema_cache() IS 'Triggers a PostgREST schema cache reload. Call this via RPC after database migrations.';
