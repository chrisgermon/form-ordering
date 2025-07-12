"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { ClinicLocation } from "@/lib/types"
import { nanoid } from "nanoid"
import { put } from "@vercel/blob"
import { scrapeWebsiteForData } from "@/lib/scraping"
import path from "path"
import { neon } from "@neondatabase/serverless"

// This is the new, corrected function to create the helper.
// It uses the Neon driver directly to bypass the Supabase client limitations for DDL.
export async function createExecuteSqlFunction() {
  try {
    // Ensure the correct environment variable is available.
    if (!process.env.NEON_DATABASE_URL) {
      return { success: false, message: "Neon database URL is not configured. Please check project environment variables." }
    }
    const sql = neon(process.env.NEON_DATABASE_URL)
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
      RETURNS void AS $$
      BEGIN
          EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql;
    `
    await sql.unsafe(createFunctionSql)
    return { success: true, message: "Helper function created successfully. You can now run other system actions." }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("Failed to create helper function:", error)
    return { success: false, message: `Failed to create helper function: ${errorMessage}` }
  }
}

// This helper function uses the Supabase client and relies on the RPC function created above.
async function executeSql(sql: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc("execute_sql", { sql_query: sql })
    if (error) {
      if (error.message.includes("function execute_sql(sql_query => text) does not exist")) {
        return {
          success: false,
          message:
            "Database helper function is missing. Please run 'Step 0: Enable System Actions' from the System tab first.",
        }
      }
      throw error
    }
    return { success: true, message: "SQL script executed successfully." }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error(`Error executing SQL:`, errorMessage)
    return { success: false, message: `Failed to execute SQL script: ${errorMessage}` }
  }
}

export async function createAdminTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        emails TEXT[],
        clinic_locations JSONB,
        active BOOLEAN DEFAULT true,
        primary_color TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS product_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        sort_order INTEGER,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS product_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID REFERENCES product_sections(id) ON DELETE CASCADE,
        brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        field_type TEXT NOT NULL,
        options JSONB,
        placeholder TEXT,
        is_required BOOLEAN DEFAULT false,
        sample_link TEXT,
        sort_order INTEGER,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        ordered_by TEXT,
        email TEXT,
        order_date DATE,
        deliver_to TEXT,
        bill_to TEXT,
        items JSONB,
        status TEXT DEFAULT 'pending',
        ip_address TEXT,
        pdf_url TEXT,
        email_response TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS uploaded_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        filename TEXT NOT NULL,
        original_name TEXT,
        url TEXT NOT NULL,
        pathname TEXT,
        content_type TEXT,
        size BIGINT,
        uploaded_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_product_sections_brand_id ON product_sections(brand_id);
    CREATE INDEX IF NOT EXISTS idx_product_items_section_id ON product_items(section_id);
    CREATE INDEX IF NOT EXISTS idx_product_items_brand_id ON product_items(brand_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_brand_id ON submissions(brand_id);
    CREATE INDEX IF NOT EXISTS idx_uploaded_files_brand_id ON uploaded_files(brand_id);
    CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
    NOTIFY pgrst, 'reload schema';
  `
  return executeSql(sql)
}

export async function initializeDatabase() {
  const sql = `
    TRUNCATE TABLE brands, product_sections, product_items, submissions, uploaded_files RESTART IDENTITY;
    INSERT INTO brands (name, slug, emails) VALUES
    ('Focus Radiology', 'focus-radiology', ARRAY['orders@focusradiology.com.au']),
    ('Vision Radiology', 'vision-radiology', ARRAY['orders@visionradiology.com.au']),
    ('Apex Radiology', 'apex-radiology', ARRAY['orders@apexradiology.com.au']),
    ('Horizon Radiology', 'horizon-radiology', ARRAY['orders@horizonradiology.com.au']),
    ('Pulse Radiology', 'pulse-radiology', ARRAY['orders@pulseradiology.com.au']);
    NOTIFY pgrst, 'reload schema';
    `
  return executeSql(sql)
}

export async function runSchemaV5Update() {
  const sql = `
    ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS pathname TEXT;
    NOTIFY pgrst, 'reload schema';
    `
  return executeSql(sql)
}

export async function forceSchemaReload() {
  const sql = `NOTIFY pgrst, 'reload schema';`
  return executeSql(sql)
}

export async function runBrandSchemaCorrection() {
  const sql = `
    ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS clinic_locations JSONB;
    ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS emails TEXT[];
    ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
    ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_slug_key;
    ALTER TABLE public.brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);
    NOTIFY pgrst, 'reload schema';
    `
  return executeSql(sql)
}

export async function runPrimaryColorFix() {
  const sql = `
    ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS primary_color TEXT;
    NOTIFY pgrst, 'reload schema';
    `
  return executeSql(sql)
}

export async function runSubmissionsFKFix() {
  const sql = `
    ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS brand_id UUID;
    ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS form_submissions_brand_id_fkey;
    ALTER TABLE public.submissions ADD CONSTRAINT form_submissions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_form_submissions_brand_id ON public.submissions(brand_id);
    NOTIFY pgrst, 'reload schema';
    `
  return executeSql(sql)
}

export async function fetchBrandData(url: string, brandSlug: string) {
  try {
    const scrapedData = await scrapeWebsiteForData(url)
    let uploadedLogoUrl: string | null = null
    if (scrapedData.logoUrl) {
      uploadedLogoUrl = await uploadLogo(scrapedData.logoUrl, brandSlug)
    }

    return {
      success: true,
      data: {
        name: scrapedData.title,
        logo: uploadedLogoUrl,
        locations: scrapedData.locations.map((loc) => ({ name: loc, address: loc, phone: "" })),
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, error: errorMessage }
  }
}

async function uploadLogo(logoUrl: string, brandSlug: string): Promise<string | null> {
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.error(`Failed to fetch logo image: ${response.statusText}`)
      return null
    }
    const imageBlob = await response.blob()
    const originalName = path.basename(new URL(logoUrl).pathname) || `logo-${nanoid(5)}`
    const filename = `logos/${brandSlug}-${Date.now()}-${originalName}`

    const { url: blobUrl } = await put(filename, imageBlob, {
      access: "public",
      contentType: response.headers.get("content-type") || undefined,
    })

    return blobUrl
  } catch (error) {
    console.error("Error uploading logo:", error)
    return null
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
  console.log("Attempted to import form for brand:", brandId, "from url:", url)
  return {
    success: false,
    message: "Form import feature is temporarily disabled due to a build issue. Please add fields manually.",
  }
}
