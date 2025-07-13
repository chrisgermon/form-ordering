-- This function allows the application's server-side actions to execute
-- raw SQL queries, which is necessary for running schema updates.
-- Run this script once from the Supabase SQL Editor.
create or replace function execute_sql(sql_query text)
returns void
language plpgsql
as $$
begin
  execute sql_query;
end;
$$;
