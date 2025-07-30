-- Drop the old text array column if it exists
ALTER TABLE brands
DROP COLUMN IF EXISTS clinics;

-- Add the new jsonb column, if it doesn't already exist
DO $$
BEGIN
IF NOT EXISTS(SELECT *
FROM information_schema.columns
WHERE table_name='brands' and column_name='clinics')
THEN
ALTER TABLE "public"."brands" ADD COLUMN "clinics" jsonb;
END IF;
END $$;
