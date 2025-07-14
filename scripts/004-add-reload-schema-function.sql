-- Create a function to notify PostgREST to reload its schema cache
create or replace function reload_schema()
returns void
language sql
as $$
  notify pgrst, 'reload schema';
$$;

-- Grant execute permission to the 'service_role'
-- This role is used by Supabase for server-side operations.
-- Our server action uses this role to execute the function.
grant execute on function reload_schema() to service_role;
