-- Create a new 'brands' table with the specified fields.
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    initials VARCHAR(5) NOT NULL,
    order_prefix VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add row-level security to the 'brands' table.
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to see only their own brands.
CREATE POLICY "user_can_read_own_brands"
ON brands FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy that allows users to insert brands for themselves.
CREATE POLICY "user_can_create_own_brands"
ON brands FOR INSERT
WITH CHECK (auth.uid() = user_id);
