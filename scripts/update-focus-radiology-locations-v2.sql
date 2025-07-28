-- This script first corrects the 'brands' table schema and then updates
    -- the 'Focus Radiology' brand with its verified clinic locations.
    -- Run this script once from your Supabase SQL Editor to apply the changes.

    -- Step 1: Correct the 'brands' table schema to ensure all necessary columns exist.
    DO $$
    BEGIN
        -- Ensure 'emails' column exists as TEXT[] and drop legacy 'email' column.
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
                ALTER TABLE brands RENAME COLUMN email TO emails;
                ALTER TABLE brands ALTER COLUMN emails TYPE TEXT[] USING ARRAY[emails];
            ELSE
                ALTER TABLE brands DROP COLUMN email;
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
            ALTER TABLE brands ADD COLUMN emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
        END IF;

        -- Ensure 'clinic_locations' column exists as JSONB.
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='clinic_locations') THEN
            ALTER TABLE brands ADD COLUMN clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
        END IF;

        -- Drop other legacy columns if they exist.
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email_to') THEN
            ALTER TABLE brands DROP COLUMN email_to;
        END IF;
    END;
    $$;

    -- Step 2: Update the clinic locations for Focus Radiology.
    UPDATE brands
    SET clinic_locations = '[
      {"name": "Berwick", "address": "Ground Floor, 76-80 Clyde Road, Berwick VIC 3806", "phone": "(03) 9707 3888"},
      {"name": "Cranbourne", "address": "24-28 Childers Street, Cranbourne VIC 3977", "phone": "(03) 5996 2922"},
      {"name": "Pakenham", "address": "Tenancy 1, 33-35 Main Street, Pakenham VIC 3810", "phone": "(03) 5941 6300"},
      {"name": "Dandenong", "address": "132-134 Thomas Street, Dandenong VIC 3175", "phone": "(03) 9791 8811"},
      {"name": "Doveton", "address": "22-24 Princes Highway, Doveton VIC 3177", "phone": "(03) 9792 9988"},
      {"name": "Epping", "address": "Tenancy 1, 761 High Street, Epping VIC 3076", "phone": "(03) 9408 8880"},
      {"name": "Heidelberg", "address": "210 Burgundy Street, Heidelberg VIC 3084", "phone": "(03) 9459 8811"},
      {"name": "Mitcham", "address": "595 Whitehorse Road, Mitcham VIC 3132", "phone": "(03) 9210 2888"},
      {"name": "Rosebud", "address": "1533 Point Nepean Road, Rosebud West VIC 3940", "phone": "(03) 5981 2888"},
      {"name": "Tecoma", "address": "1532 Burwood Highway, Tecoma VIC 3160", "phone": "(03) 9754 1100"}
    ]'::jsonb
    WHERE slug = 'focus-radiology';

    -- Step 3: Notify the API to reload its schema cache to see the changes immediately.
    NOTIFY pgrst, 'reload schema';
