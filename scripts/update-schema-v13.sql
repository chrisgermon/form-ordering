-- Add the column to store the sequence number for each brand, if it doesn't already exist.
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS order_sequence INTEGER NOT NULL DEFAULT 0;

-- This function gets the next order number for a given brand.
-- It increments the sequence, generates brand initials, and formats the final order number.
-- It's designed to be 'atomic', meaning it prevents race conditions if multiple orders are submitted at once.
CREATE OR REPLACE FUNCTION get_next_order_number(brand_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    next_seq_val INT;
    brand_initials TEXT;
    brand_name_val TEXT;
BEGIN
    -- Lock the brand's row during the transaction to ensure data consistency.
    SELECT name, order_sequence INTO brand_name_val, next_seq_val
    FROM brands
    WHERE id = brand_id_param
    FOR UPDATE;

    -- Increment the sequence number.
    next_seq_val := next_seq_val + 1;

    -- Save the new sequence number back to the database.
    UPDATE brands
    SET order_sequence = next_seq_val
    WHERE id = brand_id_param;

    -- Generate initials from the brand name (e.g., "Vision Radiology" -> "VR").
    SELECT string_agg(SUBSTRING(part, 1, 1), '')
    INTO brand_initials
    FROM unnest(string_to_array(brand_name_val, ' ')) as part;

    -- Assemble the final order number, padding the sequence to 4 digits (e.g., 1 -> "0001").
    RETURN 'PRN-' || brand_initials || '-' || LPAD(next_seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
