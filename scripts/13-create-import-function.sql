-- Drop the function if it exists to ensure a clean update
DROP FUNCTION IF EXISTS import_form_from_ai(uuid, jsonb);

CREATE OR REPLACE FUNCTION import_form_from_ai(
  p_brand_id uuid,
  p_sections jsonb -- Expects a JSONB array of section objects: [{...}, {...}]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  section_data jsonb;
  item_data jsonb;
  new_section_id uuid;
BEGIN
  -- First, delete existing sections and items for this brand to ensure a clean import.
  -- This prevents duplicating content on re-import.
  DELETE FROM items WHERE brand_id = p_brand_id;
  DELETE FROM sections WHERE brand_id = p_brand_id;

  -- The p_sections parameter is expected to be a JSON array.
  -- We iterate over each element (which is a section object) in the array.
  FOR section_data IN SELECT * FROM jsonb_array_elements(p_sections)
  LOOP
    -- Insert the new section and get its newly generated ID
    INSERT INTO sections (brand_id, title, position)
    VALUES (
      p_brand_id,
      section_data->>'title',
      (section_data->>'position')::integer
    )
    RETURNING id INTO new_section_id;

    -- Check if the section has items and if the 'items' key is an array
    IF jsonb_typeof(section_data->'items') = 'array' THEN
      -- Iterate over each item in the section's 'items' array
      FOR item_data IN SELECT * FROM jsonb_array_elements(section_data->'items')
      LOOP
        INSERT INTO items (
          brand_id,
          section_id,
          name,
          code,
          description,
          field_type,
          is_required,
          placeholder,
          position
        )
        VALUES (
          p_brand_id,
          new_section_id,
          item_data->>'name',
          -- Generate a slug from the item name for the code
          slugify(item_data->>'name'),
          item_data->>'description',
          (item_data->>'field_type')::field_type, -- Ensure this matches your ENUM type name
          (item_data->>'is_required')::boolean,
          item_data->>'placeholder',
          (item_data->>'position')::integer
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$;
