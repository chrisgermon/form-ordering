ALTER TABLE public.sections
ADD COLUMN IF NOT EXISTS sort_order smallint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.sections.sort_order IS 'Defines the display order for sections within a brand.';

-- Notify PostgREST about schema changes to prevent caching issues.
NOTIFY pgrst, 'reload schema';
