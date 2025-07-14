CREATE OR REPLACE FUNCTION import_form_from_ai(p_brand_id UUID, p_sections JSONB)
RETURNS VOID AS $$
DECLARE
    section_data JSONB;
    item_data JSONB;
    new_section_id UUID;
BEGIN
    -- Step 1: Clear existing form data for the brand
    DELETE FROM items WHERE brand_id = p_brand_id;
    DELETE FROM sections WHERE brand_id = p_brand_id;

    -- Step 2: Loop through sections from the parsed JSON
    FOR section_data IN SELECT * FROM jsonb_array_elements(p_sections)
    LOOP
        -- Insert the new section and get its generated ID
        INSERT INTO sections (brand_id, title, position)
        VALUES (
            p_brand_id,
            section_data->>'title',
            (section_data->>'position')::INT
        )
        RETURNING id INTO new_section_id;

        -- Step 3: Loop through items within the current section
        FOR item_data IN SELECT * FROM jsonb_array_elements(section_data->'items')
        LOOP
            -- Insert the new item, linking it to the new section
            INSERT INTO items (brand_id, section_id, name, description, field_type, is_required, placeholder, position)
            VALUES (
                p_brand_id,
                new_section_id,
                item_data->>'name',
                item_data->>'description',
                item_data->>'field_type',
                (item_data->>'is_required')::BOOLEAN,
                item_data->>'placeholder',
                (item_data->>'position')::INT
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
