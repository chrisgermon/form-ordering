CREATE OR REPLACE FUNCTION save_brand_form(
  brand_id_in uuid,
  brand_data jsonb,
  sections_data jsonb
) RETURNS void AS $$
DECLARE
  section jsonb;
  item jsonb;
  section_id_new uuid;
  item_id_new uuid;
  section_sort_order integer := 0;
  item_sort_order integer := 0;
BEGIN
  -- Update brand details
  UPDATE brands
  SET
    name = brand_data->>'name',
    initials = brand_data->>'initials',
    to_emails = brand_data->>'to_emails',
    cc_emails = brand_data->>'cc_emails',
    bcc_emails = brand_data->>'bcc_emails',
    subject_line = brand_data->>'subject_line',
    form_title = brand_data->>'form_title',
    form_subtitle = brand_data->>'form_subtitle',
    logo_url = brand_data->>'logo_url',
    header_image_url = brand_data->>'header_image_url'
  WHERE id = brand_id_in;

  -- Delete existing items and sections for this brand to handle deletions
  DELETE FROM product_items WHERE brand_id = brand_id_in;
  DELETE FROM product_sections WHERE brand_id = brand_id_in;

  -- Loop through sections and insert/update
  FOR section IN SELECT * FROM jsonb_array_elements(sections_data)
  LOOP
    -- Use existing ID if it's a valid UUID, otherwise generate a new one
    BEGIN
      section_id_new := (section->>'id')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      section_id_new := gen_random_uuid();
    END;
    
    INSERT INTO product_sections (id, brand_id, title, sort_order)
    VALUES (section_id_new, brand_id_in, section->>'title', section_sort_order);

    item_sort_order := 0;
    -- Loop through items in the section
    FOR item IN SELECT * FROM jsonb_array_elements(section->'product_items')
    LOOP
      -- Use existing ID if it's a valid UUID, otherwise generate a new one
      BEGIN
        item_id_new := (item->>'id')::uuid;
      EXCEPTION WHEN invalid_text_representation THEN
        item_id_new := gen_random_uuid();
      END;

      INSERT INTO product_items (id, brand_id, section_id, name, code, description, field_type, options, placeholder, is_required, sample_link, sort_order)
      VALUES (
        item_id_new,
        brand_id_in,
        section_id_new,
        item->>'name',
        item->>'code',
        item->>'description',
        (item->>'field_type')::product_item_field_type,
        (SELECT jsonb_agg(value) FROM jsonb_array_elements_text(item->'options')),
        item->>'placeholder',
        (item->>'is_required')::boolean,
        item->>'sample_link',
        item_sort_order
      );
      item_sort_order := item_sort_order + 1;
    END LOOP;
    section_sort_order := section_sort_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
