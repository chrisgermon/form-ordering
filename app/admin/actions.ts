"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { ClinicLocation } from "@/lib/types"
import { nanoid } from "nanoid"
import { put } from "@vercel/blob"
import { scrapeWebsiteWithAI, parseFormWithAI } from "@/lib/scraping"
import { Pool } from "pg"

// --- SQL Script Content ---
// By embedding the SQL here, we avoid filesystem errors in the serverless environment.

const CREATE_TABLES_SQL = `
-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    emails TEXT[] NOT NULL DEFAULT '{}',
    clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Sections Table
CREATE TABLE IF NOT EXISTS product_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    sort_order INTEGER,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Items Table
CREATE TABLE IF NOT EXISTS product_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    field_type TEXT NOT NULL DEFAULT 'checkbox_group',
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    placeholder TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    sample_link TEXT,
    sort_order INTEGER,
    section_id UUID REFERENCES product_sections(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    ordered_by TEXT,
    email TEXT,
    bill_to TEXT,
    deliver_to TEXT,
    items JSONB,
    pdf_url TEXT,
    status TEXT,
    email_response TEXT,
    order_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded Files Table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT NOT NULL,
    pathname TEXT,
    size BIGINT NOT NULL,
    content_type TEXT,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for 'updated_at'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_brands_updated_at') THEN
    CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_sections_updated_at') THEN
    CREATE TRIGGER update_product_sections_updated_at BEFORE UPDATE ON product_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_items_updated_at') THEN
    CREATE TRIGGER update_product_items_updated_at BEFORE UPDATE ON product_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
`

const SEED_BRANDS_SQL = `
INSERT INTO brands (name, slug, active, emails, clinic_locations) VALUES
('Vision Radiology', 'vision-radiology', true, '[]', '[]'),
('Light Radiology', 'light-radiology', true, '[]', '[]'),
('Quantum Medical Imaging', 'quantum-medical-imaging', true, '[]', '[]'),
('Focus Radiology', 'focus-radiology', true, '[]', '[]'),
('Pulse Radiology', 'pulse-radiology', true, '[]', '[]')
ON CONFLICT (slug) DO NOTHING;
`

const FORCE_SCHEMA_RELOAD_SQL = `NOTIFY pgrst, 'reload schema';`

const CORRECT_BRANDS_SCHEMA_SQL = `
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
            RAISE NOTICE 'Renaming column "email" to "emails" and converting to TEXT[].';
            ALTER TABLE brands RENAME COLUMN email TO emails;
            ALTER TABLE brands ALTER COLUMN emails TYPE TEXT[] USING ARRAY[emails];
        ELSE
            RAISE NOTICE 'Dropping redundant "email" column.';
            ALTER TABLE brands DROP COLUMN email;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
        RAISE NOTICE 'Adding "emails" column with type TEXT[].';
        ALTER TABLE brands ADD COLUMN emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='clinic_locations') THEN
        RAISE NOTICE 'Adding "clinic_locations" column with type JSONB.';
        ALTER TABLE brands ADD COLUMN clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email_to') THEN
        RAISE NOTICE 'Dropping legacy "email_to" column.';
        ALTER TABLE brands DROP COLUMN email_to;
    END IF;

    RAISE NOTICE 'Brands table schema correction complete.';
END;
$$;
${FORCE_SCHEMA_RELOAD_SQL}
`

const FIX_PRIMARY_COLOR_SQL = `
ALTER TABLE brands DROP COLUMN IF EXISTS primary_color;
${FORCE_SCHEMA_RELOAD_SQL}
`

const SUBMISSIONS_FK_FIX_SQL = `
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_uploaded_files_brand_id ON uploaded_files(brand_id);
${FORCE_SCHEMA_RELOAD_SQL}
`

const SEED_PULSE_RADIOLOGY_FORM_SQL = `
DO $$
DECLARE
    pulse_brand_id UUID;
BEGIN
    SELECT id INTO pulse_brand_id FROM brands WHERE slug = 'pulse-radiology';

    IF pulse_brand_id IS NOT NULL THEN
        DELETE FROM product_items WHERE brand_id = pulse_brand_id;
        DELETE FROM product_sections WHERE brand_id = pulse_brand_id;
    ELSE
        INSERT INTO brands (name, slug) VALUES ('Pulse Radiology', 'pulse-radiology')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO pulse_brand_id;
    END IF;
END $$;

WITH pulse_brand AS (
  SELECT id FROM brands WHERE slug = 'pulse-radiology'
),
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
INSERT INTO product_items (brand_id, section_id, name, code, field_type, is_required, placeholder, sort_order, options, description, sample_link)
VALUES
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Ordered By', 'ordered_by', 'text', true, 'Your Name', 0, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Email Address', 'email', 'text', true, 'your.email@example.com', 1, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Date', 'date', 'date', true, NULL, 2, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Bill to Clinic', 'bill_to', 'text', true, 'Clinic Name', 3, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM details_section), 'Deliver to Clinic', 'deliver_to', 'text', true, 'Clinic Name', 4, '[]'::jsonb, NULL, NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'Letterhead', 'PR-LTRHD', 'checkbox_group', false, 'Please enter number of boxes here', 0, '["1 box", "2 boxes", "4 boxes", "other"]'::jsonb, '2000 per box', 'https://drive.google.com/uc?export=download&id=1OXVwxKvqg9KXpRKWZR6T0V6Ob6ZR5Jfx'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'Appointment Cards', 'PR-APPNT', 'checkbox_group', false, 'Please enter number of boxes here', 1, '["1 box", "2 boxes", "4 boxes", "other"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1Itcw9bbpnZ_IZmcvwBwbQgbhdF5MHH3w'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'Euflexxa Appointment Cards', 'PR-EUFAPPNT', 'checkbox_group', false, 'Please enter number of boxes here', 2, '["1 box", "2 boxes", "4 boxes", "other"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1yBkL9PHf8pJfOx1ZOpOdXfoAAfK-mNcB'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'X-Ray Envelopes Small', 'PR-SMXE', 'checkbox_group', false, 'Please enter number of boxes here', 3, '["4 boxes", "6 boxes", "8 boxes", "other"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1HRMOWZgQEHgJLIATgim0OyC8vuhd65Jh'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'X-Ray Envelopes Large', 'PR-LGXE', 'checkbox_group', false, 'Please enter number of boxes here', 4, '["4 boxes", "6 boxes", "8 boxes", "other"]'::jsonb, '250 per box', 'https://drive.google.com/uc?export=download&id=1HRMOWZgQEHgJLIATgim0OyC8vuhd65Jh'),
((SELECT id FROM pulse_brand), (SELECT id FROM operational_section), 'A5 Labels', 'PR-A5LABEL', 'checkbox_group', false, 'Please enter number of boxes here', 5, '["5 boxes", "10 boxes", "15 boxes", "other"]'::jsonb, '1000 per box', NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A4 General', 'PR-A4BLANK1', 'checkbox_group', false, 'Please enter number of boxes here', 0, '["1 box", "2 boxes", "4 boxes", "other"]'::jsonb, '20 packs of 100 per box', 'https://drive.google.com/uc?export=download&id=1HHIHvg5tUSVh7fpYEf6jYJ1Zh2Iv02ry'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A4 Blank', 'PR-A4BLANK2', 'checkbox_group', false, 'Please enter number of boxes here', 1, '["1 box", "2 boxes", "4 boxes", "other"]'::jsonb, '20 packs of 100 per box', 'https://drive.google.com/uc?export=download&id=125ODAMbSkkBWlWk5NahseP-vJbkYNNwa'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A4 GP Cardiac', 'PR-A4GP1', 'checkbox_group', false, 'Please enter number of boxes here', 2, '["1 box", "2 boxes", "4 boxes", "other"]'::jsonb, '20 packs of 100 per box', NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A5 General', 'PR-A5GEN1', 'checkbox_group', false, 'Please enter number of boxes here', 3, '["1 box", "2 boxes", "4 boxes", "other"]'::jsonb, '40 pads of 50 per box', 'https://drive.google.com/uc?export=download&id=1DxEdOOieeuPLHA2cP8sWTy53nXQgiuFr'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A5 Dental', 'PR-A5DENTAL2', 'checkbox_group', false, 'Please enter number of boxes here', 4, '["1 box", "2 boxes", "3 boxes", "other"]'::jsonb, '40 pads of 50 per box', 'https://drive.google.com/uc?export=download&id=1jyx6bisNm0HmdQprtElr645lEAawbw19'),
((SELECT id FROM pulse_brand), (SELECT id FROM referrals_section), 'A5 Chiropractic', 'PR-A5CHIRO1', 'checkbox_group', false, 'Please enter number of boxes here', 5, '["1 box", "2 boxes", "3 boxes", "other"]'::jsonb, '40 pads of 50 per box', NULL),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'Presentation Folder', 'PR-PFOLD', 'checkbox_group', false, 'Please enter a number here', 0, '["500", "1000", "1500", "other"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1-MB1rbVzuYgp4Y3gmHFaNJ5hLSqkMmCg'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'Euflexxa', 'PR-EFX3F', 'checkbox_group', false, 'Please enter a number here', 1, '["100", "200", "300", "other"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1wUxnqat9Fb3ApQj0mHTemPm9LIijiLUk'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'Bulk Billed Interventional Procedures', 'PR-DLINJ1', 'checkbox_group', false, 'Please enter a number here', 2, '["100", "200", "300", "other"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1zbEHb5E3GyIh8yvtau5EQc3VLMJFX8Dh'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'A4 Lastography', 'PR-ELASTO', 'checkbox_group', false, 'Please enter a number here', 3, '["100", "200", "300", "other"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1qkjvH-I2IVemXp3sliOfAZaKPfSX-t0F'),
((SELECT id FROM pulse_brand), (SELECT id FROM patient_brochures_section), 'A5 Same Day Service', 'PR-A5SAMEDAY', 'checkbox_group', false, 'Please enter a number here', 4, '["100", "200", "300", "other"]'::jsonb, NULL, 'https://drive.google.com/uc?export=download&id=1gSNQ7Tw2e-VuCTeSiV8Iai1vcNz6MCCu');
${FORCE_SCHEMA_RELOAD_SQL}
`

// --- Helper Function to Execute SQL ---
async function executeSqlScript(sql: string, scriptName: string): Promise<{ success: boolean; message: string }> {
  // Use the direct connection string for pg
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  })

  try {
    await pool.query(sql)
    return { success: true, message: `Successfully executed ${scriptName}` }
  } catch (error) {
    console.error(`Error executing ${scriptName}:`, error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, message: `Failed to execute ${scriptName}: ${errorMessage}` }
  } finally {
    await pool.end()
  }
}

// --- Exported System Actions ---

export async function createAdminTables() {
  return executeSqlScript(CREATE_TABLES_SQL, "Create Tables")
}

export async function initializeDatabase() {
  return executeSqlScript(SEED_BRANDS_SQL, "Initialize Database (Seed Brands)")
}

export async function forceSchemaReload() {
  return executeSqlScript(FORCE_SCHEMA_RELOAD_SQL, "Force Schema Reload")
}

export async function runBrandSchemaCorrection() {
  return executeSqlScript(CORRECT_BRANDS_SCHEMA_SQL, "Run Brand Schema Correction")
}

export async function runPrimaryColorFix() {
  return executeSqlScript(FIX_PRIMARY_COLOR_SQL, "Run Primary Color Fix")
}

export async function runSubmissionsFKFix() {
  return executeSqlScript(SUBMISSIONS_FK_FIX_SQL, "Run Submissions FK Fix")
}

export async function seedPulseRadiologyForm() {
  return executeSqlScript(SEED_PULSE_RADIOLOGY_FORM_SQL, "Seed Pulse Radiology Form")
}

// --- Other Server Actions (Unchanged) ---

async function uploadLogo(logoUrl: string, brandSlug: string): Promise<string | null> {
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.error(`Failed to fetch logo image: ${response.statusText}`)
      return null
    }
    const imageBlob = await response.blob()
    const originalName = new URL(logoUrl).pathname.split("/").pop() || `logo-${nanoid(5)}`
    const filename = `logos/${brandSlug}-${Date.now()}-${originalName}`

    const { pathname } = await put(filename, imageBlob, {
      access: "public",
      contentType: response.headers.get("content-type") || undefined,
    })

    return pathname
  } catch (error) {
    console.error("Error uploading logo:", error)
    return null
  }
}

export async function fetchBrandData(url: string, brandSlug: string) {
  try {
    const scrapedData = await scrapeWebsiteWithAI(url)

    let uploadedLogoPath: string | null = null
    if (scrapedData.logoUrl) {
      uploadedLogoPath = await uploadLogo(scrapedData.logoUrl, brandSlug)
    }

    return {
      success: true,
      data: {
        name: scrapedData.companyName || "",
        logo: uploadedLogoPath,
        locations: scrapedData.locations || [],
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("Failed to fetch brand data with AI:", errorMessage)
    return { success: false, error: `AI scraping failed: ${errorMessage}` }
  }
}

export async function saveBrand(formData: FormData) {
  const supabase = createAdminClient()
  const id = formData.get("id") as string | null
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const logo = formData.get("logo") as string
  const emails = (formData.get("emails") as string)
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
  const clinic_locations = JSON.parse((formData.get("clinic_locations") as string) || "[]") as ClinicLocation[]

  if (!name || !slug) {
    return { success: false, error: "Brand name and slug are required." }
  }

  const brandData = {
    name,
    slug,
    logo,
    emails,
    clinic_locations,
    updated_at: new Date().toISOString(),
  }

  let error
  if (id) {
    const { error: updateError } = await supabase.from("brands").update(brandData).eq("id", id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from("brands")
      .insert({ ...brandData, created_at: new Date().toISOString() })
    error = insertError
  }

  if (error) {
    console.error("Error saving brand:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function importForm(
  brandId: string,
  brandSlug: string,
  { htmlCode, url }: { htmlCode?: string; url?: string },
) {
  const supabase = createAdminClient()

  try {
    let htmlContent = htmlCode
    if (url) {
      const response = await fetch(url)
      if (!response.ok) {
        return { success: false, message: `Failed to fetch URL: ${response.statusText}` }
      }
      htmlContent = await response.text()
    }

    if (!htmlContent) {
      return { success: false, message: "No HTML content provided or found at URL." }
    }

    const parsedForm = await parseFormWithAI(htmlContent)

    await supabase.from("product_items").delete().eq("brand_id", brandId)
    await supabase.from("product_sections").delete().eq("brand_id", brandId)

    for (const [sectionIndex, section] of parsedForm.sections.entries()) {
      const { data: newSection, error: sectionError } = await supabase
        .from("product_sections")
        .insert({
          brand_id: brandId,
          title: section.title,
          sort_order: sectionIndex,
        })
        .select("id")
        .single()

      if (sectionError) throw new Error(`Failed to insert section "${section.title}": ${sectionError.message}`)

      if (section.items && section.items.length > 0) {
        const itemsToInsert = section.items.map((item, itemIndex) => ({
          brand_id: brandId,
          section_id: newSection.id,
          code: item.code,
          name: item.name,
          field_type: item.fieldType,
          options: item.options || [],
          placeholder: item.placeholder,
          is_required: item.isRequired || false,
          sort_order: itemIndex,
        }))

        const { error: itemsError } = await supabase.from("product_items").insert(itemsToInsert)
        if (itemsError) throw new Error(`Failed to insert items for section "${section.title}": ${itemsError.message}`)
      }
    }

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)

    return { success: true, message: "Form imported successfully!" }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import."
    console.error("Error importing form:", errorMessage)
    return { success: false, message: errorMessage }
  }
}

export async function clearFormForBrand(brandId: string, brandSlug: string) {
  const supabase = createAdminClient()

  const { data: sections, error: sectionsError } = await supabase
    .from("product_sections")
    .select("id")
    .eq("brand_id", brandId)

  if (sectionsError) {
    console.error("Error fetching sections:", sectionsError)
    return { success: false, message: "Failed to fetch form sections." }
  }

  if (sections && sections.length > 0) {
    const sectionIds = sections.map((s) => s.id)

    const { error: itemsError } = await supabase.from("product_items").delete().in("section_id", sectionIds)

    if (itemsError) {
      console.error("Error deleting form items:", itemsError)
      return { success: false, message: "Failed to clear form items." }
    }
  }

  const { error: deleteSectionsError } = await supabase.from("product_sections").delete().eq("brand_id", brandId)

  if (deleteSectionsError) {
    console.error("Error deleting form sections:", deleteSectionsError)
    return { success: false, message: "Failed to clear form sections." }
  }

  revalidatePath(`/admin/editor/${brandSlug}`)
  return { success: true, message: "Form has been cleared successfully." }
}
