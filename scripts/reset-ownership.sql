-- This script resets the ownership of all application tables to the 'postgres' user.
-- Run this script directly in your Supabase SQL Editor if you encounter
-- "must be owner of table" or other permission-related errors.

ALTER TABLE public.brands OWNER TO postgres;
ALTER TABLE public.product_sections OWNER TO postgres;
ALTER TABLE public.product_items OWNER TO postgres;
ALTER TABLE public.uploaded_files OWNER TO postgres;
ALTER TABLE public.submissions OWNER TO postgres;

-- Grant all privileges on these tables to the service_role, which is used by the application's backend.
-- This ensures the app can still read/write data after the ownership change.
GRANT ALL ON TABLE public.brands TO service_role;
GRANT ALL ON TABLE public.product_sections TO service_role;
GRANT ALL ON TABLE public.product_items TO service_role;
GRANT ALL ON TABLE public.uploaded_files TO service_role;
GRANT ALL ON TABLE public.submissions TO service_role;

-- Also grant usage on sequences to avoid issues with inserts.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- After running, it's a good idea to reload the schema cache.
NOTIFY pgrst, 'reload schema';
