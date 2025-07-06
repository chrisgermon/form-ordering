-- This comprehensive script ensures the 'brands' table and related functions are fully up-to-date.
-- It adds all required columns for form editing, email, and order number generation.
-- It is idempotent and safe to run multiple times.

-- Section 1: Align 'brands' table columns

-- Rename 'logo' to 'logo_url' for consistency, if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'logo') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'logo_url') THEN
        ALTER TABLE brands RENAME COLUMN logo TO logo_url;
    END IF;
END;
$$;

-- Add all necessary columns if they don't exist
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS order_prefix TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS order_sequence INTEGER NOT NULL DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS header_image_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS form_subtitle TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS subject_line TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS to_emails TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS cc_emails TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bcc_emails TEXT;

-- Drop the old 'emails' column (type TEXT[]) if it exists and has been replaced.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'emails') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'to_emails') THEN
        -- Check if the old column is an array type before dropping, to be safe
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'emails') = 'ARRAY' THEN
            ALTER TABLE brands DROP COLUMN emails;
        END IF;
    END IF;
END;
$$;


-- Section 2: Update the order number generation function
CREATE OR REPLACE FUNCTION get_next_order_number(brand_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    next_seq_val INT;
    brand_initials_val TEXT;
    brand_prefix_val TEXT;
BEGIN
    -- Lock the brand's row during the transaction to ensure data consistency.
    SELECT initials, order_prefix, order_sequence INTO brand_initials_val, brand_prefix_val, next_seq_val
    FROM brands
    WHERE id = brand_id_param
    FOR UPDATE;

    -- Increment the sequence number.
    next_seq_val := next_seq_val + 1;

    -- Save the new sequence number back to the database.
    UPDATE brands
    SET order_sequence = next_seq_val
    WHERE id = brand_id_param;

    -- Assemble the final order number using the prefix and initials from the table.
    -- Fallback to 'PRN' and generated initials if columns are null.
    RETURN COALESCE(brand_prefix_val, 'PRN') || '-' || COALESCE(brand_initials_val, 'NA') || '-' || LPAD(next_seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;


-- Section 3: Force schema reload
NOTIFY pgrst, 'reload schema';
