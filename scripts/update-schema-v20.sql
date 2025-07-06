-- This script aligns the 'brands' table schema with the form editor's fields.
-- It renames 'logo' to 'logo_url' and adds several new columns for email configuration and form display.
-- It is safe to run multiple times.

DO $$
BEGIN
    -- Rename 'logo' to 'logo_url' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'logo') THEN
        ALTER TABLE brands RENAME COLUMN logo TO logo_url;
    END IF;
END;
$$;

-- Add columns for form display and branding
ALTER TABLE brands ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS header_image_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS form_subtitle TEXT;

-- Add columns for email configuration
ALTER TABLE brands ADD COLUMN IF NOT EXISTS subject_line TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS to_emails TEXT; -- Storing as comma-separated string
ALTER TABLE brands ADD COLUMN IF NOT EXISTS cc_emails TEXT; -- Storing as comma-separated string
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bcc_emails TEXT; -- Storing as comma-separated string

-- Drop the old 'emails' column (TEXT[]) as it's being replaced by more specific fields.
-- Only drop if the new columns exist to avoid data loss if script is run partially.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'emails') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'to_emails') THEN
        ALTER TABLE brands DROP COLUMN emails;
    END IF;
END;
$$;

-- Force schema reload for PostgREST to recognize the changes immediately.
NOTIFY pgrst, 'reload schema';
