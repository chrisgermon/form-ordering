-- Add a 'clinics' column to the 'brands' table to store a list of clinic locations.
-- This uses JSONB for flexibility, allowing us to store an array of strings.
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS clinics JSONB DEFAULT '[]'::jsonb;

-- Add a comment to explain the purpose of the new column.
COMMENT ON COLUMN brands.clinics IS 'An array of clinic location names associated with the brand.';

-- For existing brands, we can populate this with the default list as a starting point.
-- This is optional but helpful for a smooth transition.
UPDATE brands
SET clinics = '["Botanic Ridge", "Bulleen", "Carnegie", "Coburg", "Diamond Creek", "Greensborough", "Hampton East", "Kangaroo Flat", "Kyabram", "Lilydale", "Lynbrook", "Mentone", "Mornington", "Mulgrave", "North Melbourne", "Reservoir", "Sebastopol", "Shepparton", "Thornbury", "Torquay", "Werribee", "Williamstown"]'::jsonb
WHERE clinics = '[]'::jsonb OR clinics IS NULL;
