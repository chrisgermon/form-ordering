-- Add columns for order number generation
ALTER TABLE brands ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Add a unique constraint to ensure no duplicate order numbers
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'submissions_order_number_key' AND conrelid = 'submissions'::regclass
  ) THEN
      ALTER TABLE submissions ADD CONSTRAINT submissions_order_number_key UNIQUE (order_number);
  END IF;
END;
$$;

-- Create a table to manage sequences for each brand to track order numbers.
-- This ensures that order numbers are sequential per brand.
CREATE TABLE IF NOT EXISTS brand_order_sequences (
brand_id UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
last_value INT NOT NULL DEFAULT 0
);

-- Function to get the next order number for a given brand.
-- This function is transactional and safe for concurrent requests.
CREATE OR REPLACE FUNCTION get_next_order_number(p_brand_id UUID)
RETURNS VARCHAR AS $$
DECLARE
brand_initials VARCHAR;
next_val INT;
new_order_number VARCHAR;
BEGIN
-- Retrieve the initials for the given brand ID.
SELECT initials INTO brand_initials FROM brands WHERE id = p_brand_id;

-- If initials are not set, we cannot generate an order number.
IF brand_initials IS NULL OR brand_initials = '' THEN
  RAISE EXCEPTION 'Brand with ID % does not have initials set. Please set them in the admin dashboard.', p_brand_id;
END IF;

-- Atomically increment the sequence for the brand and get the new value.
-- 'ON CONFLICT' handles the case where the brand is getting its first order number.
INSERT INTO brand_order_sequences (brand_id, last_value)
VALUES (p_brand_id, 1)
ON CONFLICT (brand_id)
DO UPDATE SET last_value = brand_order_sequences.last_value + 1
RETURNING last_value INTO next_val;

-- Format the order number (e.g., FR-00001).
new_order_number := brand_initials || '-' || LPAD(next_val::TEXT, 5, '0');

RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- New RPC function to create an order and generate its number in a single database transaction.
-- This ensures data integrity.
CREATE OR REPLACE FUNCTION create_new_order(
p_brand_id UUID,
p_ordered_by TEXT,
p_email TEXT,
p_bill_to TEXT,
p_deliver_to TEXT,
p_order_date DATE,
p_items JSONB,
p_pdf_url TEXT,
p_ip_address TEXT,
p_status TEXT
)
RETURNS submissions AS $$
DECLARE
new_order_number VARCHAR;
new_submission submissions;
BEGIN
-- Generate the next unique order number for the brand.
SELECT get_next_order_number(p_brand_id) INTO new_order_number;

-- Insert the new submission with the generated order number.
INSERT INTO submissions (
  brand_id,
  ordered_by,
  email,
  bill_to,
  deliver_to,
  order_date,
  items,
  pdf_url,
  ip_address,
  status,
  order_number
)
VALUES (
  p_brand_id,
  p_ordered_by,
  p_email,
  p_bill_to,
  p_deliver_to,
  p_order_date,
  p_items,
  p_pdf_url,
  p_ip_address,
  p_status,
  new_order_number
)
RETURNING * INTO new_submission;

RETURN new_submission;
END;
$$ LANGUAGE plpgsql;
