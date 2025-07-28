"use server"

import { createAdminClient } from "@/utils/supabase/server"
import initializeDatabaseFunction from "@/lib/seed-database"
import { revalidatePath } from "next/cache"
import * as cheerio from "cheerio"
import type { ProductItem } from "./editor/[brandSlug]/types"
import nodemailer from "nodemailer"

async function executeSql(sql: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.rpc("execute_sql", { sql_query: sql })
  if (error) throw error
}

export async function createAdminTables() {
  try {
    const sql = `-- Create brands table
CREATE TABLE brands (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
logo TEXT,
primary_color TEXT DEFAULT 'blue-600',
emails JSONB NOT NULL DEFAULT '[]'::jsonb,
clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
active BOOLEAN DEFAULT true,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_sections table
CREATE TABLE product_sections (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
title TEXT NOT NULL,
brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
sort_order INTEGER DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_items table
CREATE TABLE product_items (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
code TEXT NOT NULL,
name TEXT NOT NULL,
description TEXT,
quantities JSONB NOT NULL DEFAULT '[]',
sample_link TEXT,
section_id UUID REFERENCES product_sections(id) ON DELETE CASCADE,
brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
sort_order INTEGER DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded_files table
CREATE TABLE uploaded_files (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
filename TEXT NOT NULL,
original_name TEXT NOT NULL,
url TEXT NOT NULL,
size BIGINT NOT NULL,
content_type TEXT,
uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_sections_brand_id ON product_sections(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_items_section_id ON product_items(section_id);
CREATE INDEX IF NOT EXISTS idx_product_items_brand_id ON product_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_filename ON uploaded_files(filename);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_brands_updated_at 
  BEFORE UPDATE ON brands 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_sections_updated_at 
  BEFORE UPDATE ON product_sections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_items_updated_at 
  BEFORE UPDATE ON product_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();`
    await executeSql(sql)
    return { success: true, message: "Admin tables created successfully!" }
  } catch (error: any) {
    console.error("Error creating admin tables:", error)
    return { success: false, message: `Failed to create admin tables: ${error.message}` }
  }
}

export async function initializeDatabase() {
  try {
    await initializeDatabaseFunction()
    revalidatePath("/admin")
    return { success: true, message: "Database initialized successfully with 5 brands!" }
  } catch (error: any) {
    console.error("Error initializing database:", error)
    return { success: false, message: `Failed to initialize database: ${error.message}` }
  }
}

export async function autoAssignPdfs() {
  const supabase = createAdminClient()
  try {
    const { data: files, error: filesError } = await supabase.from("uploaded_files").select("original_name, url")
    if (filesError) throw filesError

    const { data: items, error: itemsError } = await supabase
      .from("product_items")
      .select("id, code")
      .is("sample_link", null)
    if (itemsError) throw itemsError

    let assignments = 0
    for (const item of items) {
      const matchingFile = files.find((file) => file.original_name.toUpperCase().startsWith(item.code.toUpperCase()))
      if (matchingFile) {
        await supabase.from("product_items").update({ sample_link: matchingFile.url }).eq("id", item.id)
        assignments++
      }
    }
    revalidatePath("/admin")
    return { success: true, message: `Auto-assigned ${assignments} PDF links.` }
  } catch (error: any) {
    return { success: false, message: `Failed to auto-assign PDFs: ${error.message}` }
  }
}

const slugify = (text: string) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

export async function importFromJotform(brandId: string, brandSlug: string, htmlCode: string) {
  if (!htmlCode) {
    return { success: false, message: "HTML code cannot be empty." }
  }

  try {
    const supabase = createAdminClient()
    const $ = cheerio.load(htmlCode)

    // 1. Pre-process all descriptive text blocks into a map.
    // Key: CODE, Value: { name, description, sample_link }
    const descriptionMap = new Map<string, { name: string; description: string | null; sample_link: string | null }>()
    $('li[data-type="control_text"]').each((_, element) => {
      const $el = $(element)
      const htmlContent = ($el.find(".form-html").html() || "").replace(/<br\s*\/?>/gi, "\n")
      const textContent = cheerio.load(`<div>${htmlContent}</div>`).text()
      const lines = textContent
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)

      let code: string | null = null
      let name: string | null = null
      let description: string | null = null

      lines.forEach((line) => {
        const parts = line.split(":")
        const key = parts.shift()?.trim().toUpperCase()
        const value = parts.join(":").trim()

        if (key === "CODE") code = value
        else if (key === "ITEM" || key === "REFERRALS" || key === "PATIENT BROCHURES") name = value
        else if (key === "DESCRIPTION") description = value
      })

      const sample_link = $el.find("a").attr("href") || null

      if (code && name) {
        descriptionMap.set(code, { name, description, sample_link })
      }
    })

    const createdSections: { title: string; items: any[] }[] = []

    // Find all section containers
    $("ul.form-section").each((index, sectionEl) => {
      const $sectionEl = $(sectionEl)
      let sectionTitle = `Imported Section ${index + 1}`

      const prevHeader = $sectionEl.prev('li[data-type="control_head"]')
      const collapseEl = $sectionEl.find('li[data-type="control_collapse"]').first()
      const headerEl = $sectionEl.find('li[data-type="control_head"]').first()

      if (prevHeader.length > 0) {
        sectionTitle = prevHeader.find(".form-header").text().trim()
      } else if (collapseEl.length > 0) {
        sectionTitle = collapseEl.find(".form-collapse-mid").text().trim()
      } else if (headerEl.length > 0) {
        sectionTitle = headerEl.find(".form-header").text().trim()
      }

      const sectionItems: any[] = []

      $sectionEl.find("li.form-line").each((_, lineEl) => {
        const $lineEl = $(lineEl)
        const dataType = $lineEl.data("type")
        let item: any = null

        if (dataType === "control_checkbox" || dataType === "control_radio") {
          const code = $lineEl.find("label.form-label").text().trim()
          const details = descriptionMap.get(code)
          if (details) {
            const options: string[] = []
            $lineEl.find(".form-checkbox-item, .form-radio-item").each((_, optEl) => {
              options.push($(optEl).find("label").text().trim())
            })
            item = {
              ...details,
              code,
              field_type: "checkbox_group",
              options,
              is_required: $lineEl.hasClass("jf-required"),
            }
          }
        } else if (
          dataType === "control_textbox" ||
          dataType === "control_textarea" ||
          dataType === "control_datetime"
        ) {
          const label = $lineEl.find("label.form-label").text().trim().replace(/\*$/, "").trim()
          if (label) {
            let field_type: ProductItem["field_type"] = "text"
            if (dataType === "control_textarea") field_type = "textarea"
            if (dataType === "control_datetime") field_type = "date"

            item = {
              name: label,
              code: slugify(label),
              description: $lineEl.find(".form-sub-label").text().trim() || null,
              field_type,
              options: [],
              placeholder: $lineEl.find("input, textarea").attr("placeholder") || null,
              is_required: $lineEl.hasClass("jf-required"),
              sample_link: null,
            }
          }
        }

        if (item) {
          sectionItems.push(item)
        }
      })

      if (sectionItems.length > 0) {
        createdSections.push({ title: sectionTitle, items: sectionItems })
      }
    })

    if (createdSections.length === 0) {
      return { success: false, message: "Could not find any form fields to import. Please check the Jotform code." }
    }

    // Now, save to database
    let sortOrder = 999
    for (const section of createdSections) {
      const { data: newSection, error: sectionError } = await supabase
        .from("product_sections")
        .insert({
          title: section.title,
          brand_id: brandId,
          sort_order: sortOrder++,
        })
        .select()
        .single()

      if (sectionError) throw sectionError

      const itemsToInsert = section.items.map((item, index) => ({
        ...item,
        brand_id: brandId,
        section_id: newSection.id,
        sort_order: index,
      }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from("product_items").insert(itemsToInsert)
        if (itemsError) throw itemsError
      }
    }

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    return {
      success: true,
      message: `Successfully imported ${createdSections.reduce((acc, s) => acc + s.items.length, 0)} fields from Jotform.`,
    }
  } catch (error) {
    console.error("Jotform import error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import."
    return { success: false, message: `Import failed: ${errorMessage}` }
  }
}

export async function runSchemaV5Update() {
  try {
    const sql = `-- This script adds a 'pathname' column to the 'uploaded_files' table
-- to support relative, domain-proxied file URLs.
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS pathname TEXT;

-- This will backfill the new 'pathname' column for existing files based on their current URL.
-- This assumes the URL format is https://[...].blob.vercel-storage.com/[pathname]
UPDATE uploaded_files
SET pathname = SUBSTRING(url FROM 'https://[^/]+/(.*)')
WHERE pathname IS NULL AND url LIKE 'https://%.blob.vercel-storage.com/%';`
    await executeSql(sql)
    return { success: true, message: "Schema updated successfully for relative URLs!" }
  } catch (error: any) {
    console.error("Error running schema v5 update:", error)
    return { success: false, message: `Failed to update schema: ${error.message}` }
  }
}

export async function forceSchemaReload() {
  try {
    const sql = `NOTIFY pgrst, 'reload schema';`
    await executeSql(sql)
    return { success: true, message: "Schema cache reloaded successfully! Please try your previous action again." }
  } catch (error: any) {
    console.error("Error forcing schema reload:", error)
    return { success: false, message: `Failed to reload schema: ${error.message}` }
  }
}

export async function runBrandSchemaCorrection() {
  try {
    const sql = `-- This script corrects the schema for the 'brands' table to match the application code.
-- It handles multiple possible incorrect states and ensures the final schema is correct.
-- It is safe to run this script multiple times.

DO $$
BEGIN
    -- Step 1: Handle the 'email' vs 'emails' column.
    -- If the incorrect singular 'email' column exists...
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email') THEN
        -- ...and the correct plural 'emails' column does NOT exist...
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
            -- ...rename 'email' to 'emails' and change its type to TEXT[].
            RAISE NOTICE 'Renaming column "email" to "emails" and converting to TEXT[].';
            ALTER TABLE brands RENAME COLUMN email TO emails;
            -- The data in a single TEXT column will be cast to a single-element array.
            ALTER TABLE brands ALTER COLUMN emails TYPE TEXT[] USING ARRAY[emails];
        ELSE
            -- ...but if 'emails' already exists, just drop the incorrect 'email' column.
            RAISE NOTICE 'Dropping redundant "email" column.';
            ALTER TABLE brands DROP COLUMN email;
        END IF;
    END IF;

    -- Step 2: Ensure 'emails' column exists as TEXT[] if it wasn't created in step 1.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='emails') THEN
        RAISE NOTICE 'Adding "emails" column with type TEXT[].';
        ALTER TABLE brands ADD COLUMN emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Step 3: Ensure 'clinic_locations' column exists as JSONB.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='clinic_locations') THEN
        RAISE NOTICE 'Adding "clinic_locations" column with type JSONB.';
        ALTER TABLE brands ADD COLUMN clinic_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;

    -- Step 4: Drop legacy 'email_to' column if it exists.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='email_to') THEN
        RAISE NOTICE 'Dropping legacy "email_to" column.';
        ALTER TABLE brands DROP COLUMN email_to;
    END IF;

    RAISE NOTICE 'Brands table schema correction complete.';
END;
$$;

-- After correcting the schema, force the API to reload its cache.
NOTIFY pgrst, 'reload schema';`
    await executeSql(sql)
    return {
      success: true,
      message: "Brands table schema corrected and cache reloaded successfully! The page should now work correctly.",
    }
  } catch (error: any) {
    console.error("Error correcting brands schema:", error)
    return { success: false, message: `Failed to correct schema: ${error.message}` }
  }
}

export async function sendTestEmail(recipientEmail: string) {
  if (!process.env.MAILGUN_SMTP_USERNAME || !process.env.MAILGUN_SMTP_PASSWORD) {
    return { success: false, message: "Mailgun SMTP credentials are not configured in environment variables." }
  }
  if (!process.env.FROM_EMAIL) {
    return { success: false, message: "FROM_EMAIL is not configured in environment variables." }
  }

  const transporter = nodemailer.createTransport({
    service: "Mailgun",
    pool: true,
    auth: {
      user: process.env.MAILGUN_SMTP_USERNAME,
      pass: process.env.MAILGUN_SMTP_PASSWORD,
    },
  })

  const mailOptions = {
    from: `"Order Form System" <${process.env.FROM_EMAIL}>`,
    to: recipientEmail,
    subject: "✅ Test Email from Order Form System",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2a3760;">Email Test Successful!</h2>
          <p>This is a test email sent from the admin dashboard of the form ordering system.</p>
          <p>If you have received this message, it confirms that your email (Mailgun SMTP) configuration is working correctly.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Test email sent: " + info.response)
    return { success: true, message: `Test email successfully sent to ${recipientEmail}.` }
  } catch (error) {
    console.error("Error sending test email:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown email error"
    return { success: false, message: `Failed to send test email: ${errorMessage}` }
  }
}
