-- This script migrates the 'clinic_locations' column in the 'brands' table
-- from an array of strings to an array of objects with name, address, and phone fields.
-- It is safe to run this script multiple times.

DO $$
DECLARE
    brand_record RECORD;
    location_element JSONB;
    new_locations JSONB;
    is_old_format BOOLEAN := false;
BEGIN
    -- Loop through each brand to check and migrate its clinic_locations
    FOR brand_record IN SELECT id, clinic_locations FROM brands LOOP
        -- Check if the clinic_locations array is not empty and the first element is a string
        IF jsonb_array_length(brand_record.clinic_locations) > 0 AND jsonb_typeof(brand_record.clinic_locations -> 0) = 'string' THEN
            is_old_format := true;
        ELSE
            is_old_format := false;
        END IF;

        -- If it's the old format, perform the migration
        IF is_old_format THEN
            new_locations := '[]'::jsonb;
            -- Loop through each string location and convert it to an object
            FOR location_element IN SELECT * FROM jsonb_array_elements_text(brand_record.clinic_locations) LOOP
                new_locations := new_locations || jsonb_build_object(
                    'name', location_element,
                    'address', '',
                    'phone', ''
                );
            END LOOP;
            
            -- Update the brand with the new structured data
            UPDATE brands
            SET clinic_locations = new_locations
            WHERE id = brand_record.id;
            
            RAISE NOTICE 'Migrated clinic_locations for brand ID % to new object format.', brand_record.id;
        END IF;
    END LOOP;
END;
$$;
