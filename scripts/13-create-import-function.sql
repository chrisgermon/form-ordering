-- Drop the function if it exists to ensure a clean update
DROP FUNCTION IF EXISTS import_form_from_ai(uuid, jsonb);

CREATE OR REPLACE FUNCTION import_brand_form(
    p_brand_slug TEXT,
    p_form_structure JSONB
)
RETURNS VOID AS $$
DECLARE
    v_brand_id UUID;
    section_record RECORD;
    item_record RECORD;
    v_section_id UUID;
    section_sort_order INT := 0;
    item_sort_order INT;
BEGIN
    -- Find the brand_id from the slug
    SELECT id INTO v_brand_id FROM brands WHERE slug = p_brand_slug;
    IF v_brand_id IS NULL THEN
        RAISE EXCEPTION 'Brand with slug % not found', p_brand_slug;
    END IF;

    -- Clear existing form data for this brand
    DELETE FROM items WHERE brand_id = v_brand_id;
    DELETE FROM sections WHERE brand_id = v_brand_id;

    -- Loop through each section in the JSONB object
    FOR section_record IN SELECT * FROM jsonb_each(p_form_structure)
    LOOP
        -- Insert the new section
        INSERT INTO sections (brand_id, title, sort_order)
        VALUES (v_brand_id, section_record.key, section_sort_order)
        RETURNING id INTO v_section_id;

        item_sort_order := 0;
        -- Loop through each item in the section's array
        FOR item_record IN SELECT * FROM jsonb_to_recordset(section_record.value) AS x(name TEXT, code TEXT)
        LOOP
            -- Insert the new item
            INSERT INTO items (section_id, name, item_code, sort_order)
            VALUES (v_section_id, item_record.name, item_record.code, item_sort_order);

            item_sort_order := item_sort_order + 1;
        END LOOP;

        section_sort_order := section_sort_order + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
