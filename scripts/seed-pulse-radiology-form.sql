-- Clear existing form data for Pulse Radiology to ensure a clean slate.
DO $$
DECLARE
    pulse_brand_id UUID;
BEGIN
    -- Get the brand_id for 'pulse-radiology'
    SELECT id INTO pulse_brand_id FROM brands WHERE slug = 'pulse-radiology';

    -- If the brand exists, delete its associated form items and sections
    IF pulse_brand_id IS NOT NULL THEN
        DELETE FROM product_items WHERE brand_id = pulse_brand_id;
        DELETE FROM product_sections WHERE brand_id = pulse_brand_id;
    END IF;
END $$;

-- Seed the new form structure for Pulse Radiology
WITH pulse_brand AS (
  SELECT id FROM brands WHERE slug = 'pulse-radiology'
),
-- Create Sections
details_section AS (
  INSERT INTO product_sections (brand_id, title, sort_order)
  SELECT id, 'Order Details', 0 FROM pulse_brand
  RETURNING id
),
operational_section AS (
  INSERT INTO product_sections (brand_id, title, sort_order)
  SELECT id, 'Operational and Patient Brochures', 1 FROM pulse_brand
  RETURNING id
),
referrals_section AS (
  INSERT INTO product_sections (brand_id, title, sort_order)
  SELECT id, 'Referrals', 2 FROM pulse_brand
  RETURNING id
),
patient_brochures_section AS (
  INSERT INTO product_sections (brand_id, title, sort_order)
  SELECT id, 'Patient Brochures', 3 FROM pulse_brand
  RETURNING id
)
-- Insert Items
INSERT INTO product_items (brand_id, section_id, name, code, field_type, is_required, placeholder, sort_order, options, description, sample_link)
VALUES
-- Order Details
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Ordered By', NULL, 'text', true, NULL, 0, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Email Address', NULL, 'text', true, NULL, 1, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Date', NULL, 'date', true, NULL, 2, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Bill to Clinic', NULL, 'text', true, NULL, 3, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Deliver to Clinic', NULL, 'text', true, NULL, 4, '[]'::jsonb, NULL, NULL),

-- Operational and Patient Brochures
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'Letterhead', 'PR-LTRHD', 'checkbox_group_custom', false, 'Please enter number of boxes here', 0, '["1 box", "2 boxes", "4 boxes"]'::jsonb, '2000 per box', 'https://drive.google.com/uc?export=download&id=1OXVwxKvqg9KXpRKWZR6T0V6Ob6ZR5Jfx'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'Appointment Cards', 'PR-APPNT', 'checkbox_group_custom', false, 'Please enter number of boxes here', 1, '["1 box", "2 boxes", "4 boxes"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1Itcw9bbpnZ_IZmcvwBwbQgbhdF5MHH3w'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'Euflexxa Appointment Cards', 'PR-EUFAPPNT', 'checkbox_group_custom', false, 'Please enter number of boxes here', 2, '["1 box", "2 boxes", "4 boxes"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1yBkL9PHf8pJfOx1ZOpOdXfoAAfK-mNcB'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'X-Ray Envelopes Small', 'PR-SMXE', 'checkbox_group_custom', false, 'Please enter number of boxes here', 3, '["4 boxes", "6 boxes", "8 boxes"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1HRMOWZgQEHgJLIATgim0OyC8vuhd65Jh'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'X-Ray Envelopes Large', 'PR-LGXE', 'checkbox_group_custom', false, 'Please enter number of boxes here', 4, '["4 boxes", "6 boxes", "8 boxes"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1HRMOWZgQEHgJLIATgim0OyC8vuhd65Jh'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'A5 Labels', 'PR-A5LABEL', 'checkbox_group_custom', false, 'Please enter number of boxes here', 5, '["5 boxes", "10 boxes", "15 boxes"]'::jsonb, '1000 per box', NULL),

-- Referrals
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A4 General', 'PR-A4BLANK1', 'checkbox_group_custom', false, 'Please enter number of boxes here', 0, '["1 box", "2 boxes", "4 boxes"]'::jsonb, '20 packs of 100 per box', 'https://drive.google.com/uc?export=download&id=1HHIHvg5tUSVh7fpYEf6jYJ1Zh2Iv02ry'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A4 Blank', 'PR-A4BLANK2', 'checkbox_group_custom', false, 'Please enter number of boxes here', 1, '["1 box", "2 boxes", "4 boxes"]'::jsonb, '20 packs of 100 per box', 'https://drive.google.com/uc?export=download&id=125ODAMbSkkBWlWk5NahseP-vJbkYNNwa'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A4 GP Cardiac', 'PR-A4GP1', 'checkbox_group_custom', false, 'Please enter number of boxes here', 2, '["1 box", "2 boxes", "4 boxes"]'::jsonb, '20 packs of 100 per box', NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A5 General', 'PR-A5GEN1', 'checkbox_group_custom', false, 'Please enter number of boxes here', 3, '["1 box", "2 boxes", "4 boxes"]'::jsonb, '40 pads of 50 per box', 'https://drive.google.com/uc?export=download&id=1DxEdOOieeuPLHA2cP8sWTy53nXQgiuFr'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A5 Dental', 'PR-A5DENTAL2', 'checkbox_group_custom', false, 'Please enter number of boxes here', 4, '["1 box", "2 boxes", "3 boxes"]'::jsonb, '40 pads of 50 per box', 'https://drive.google.com/uc?export=download&id=1jyx6bisNm0HmdQprtElr645lEAawbw19'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A5 Chiropractic', 'PR-A5CHIRO1', 'checkbox_group_custom', false, 'Please enter number of boxes here', 5, '["1 box", "2 boxes", "3 boxes"]'::jsonb, '40 pads of 50 per box', NULL),

-- Patient Brochures
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'Presentation Folder', 'PR-PFOLD', 'checkbox_group_custom', false, 'Please enter a number here', 0, '["500", "1000", "1500"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1-MB1rbVzuYgp4Y3gmHFaNJ5hLSqkMmCg'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'Euflexxa', 'PR-EFX3F', 'checkbox_group_custom', false, 'Please enter a number here', 1, '["100", "200", "300"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1wUxnqat9Fb3ApQj0mHTemPm9LIijiLUk'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'Bulk Billed Interventional Procedures', 'PR-DLINJ1', 'checkbox_group_custom', false, 'Please enter a number here', 2, '["100", "200", "300"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1zbEHb5E3GyIh8yvtau5EQc3VLMJFX8Dh'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'A4 Lastography', 'PR-ELASTO', 'checkbox_group_custom', false, 'Please enter a number here', 3, '["100", "200", "300"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1qkjvH-I2IVemXp3sliOfAZaKPfSX-t0F'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'A5 Same Day Service', 'PR-A5SAMEDAY', 'checkbox_group_custom', false, 'Please enter a number here', 4, '["100", "200", "300"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1gSNQ7Tw2e-VuCTeSiV8Iai1vcNz6MCCu');

-- Force schema reload for PostgREST
NOTIFY pgrst, 'reload schema';
