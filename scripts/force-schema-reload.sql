-- This command sends a direct notification to the PostgREST API layer,
-- instructing it to immediately reload its internal schema cache.
-- This is the recommended way to resolve stale schema issues on live projects
-- without needing to restart the entire project.
NOTIFY pgrst, 'reload schema';
