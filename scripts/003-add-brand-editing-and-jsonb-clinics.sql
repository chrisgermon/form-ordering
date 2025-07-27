-- Drop the existing clinics column if it's of type text[]
DO $$
BEGIN
    IF EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='brands' AND column_name='clinics' AND udt_name='_text'
    ) THEN
        ALTER TABLE brands DROP COLUMN clinics;
    END IF;
END $$;

-- Add the new clinics column as jsonb if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='brands' AND column_name='clinics' AND data_type='jsonb'
    ) THEN
        ALTER TABLE brands ADD COLUMN clinics JSONB;
    END IF;
END $$;

-- Add other columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'brands'::regclass AND attname = 'primary_color' AND NOT attisdropped) THEN
        ALTER TABLE "brands" ADD COLUMN "primary_color" text;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'brands'::regclass AND attname = 'email' AND NOT attisdropped) THEN
        ALTER TABLE "brands" ADD COLUMN "email" text;
    END IF;
END $$;
