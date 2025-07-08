"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import * as cheerio from "cheerio"
import type { ProductItem } from "@/lib/types"

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

const brandFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required."),
  active: z.preprocess((val) => val === "on" || val === true, z.boolean()),
  logo_url: z.string().optional().nullable(),
  to_emails: z.string().optional(),
  cc_emails: z.string().optional(),
  bcc_emails: z.string().optional(),
  clinic_locations: z.string().optional(),
})

export async function createOrUpdateBrand(prevState: any, formData: FormData) {
  const supabase = createAdminClient()
  const validatedFields = brandFormSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { id, ...brandData } = validatedFields.data

  const stringToArray = (str: string | undefined) =>
    str
      ? str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []

  let clinicLocationsData = []
  try {
    if (brandData.clinic_locations) {
      clinicLocationsData = JSON.parse(brandData.clinic_locations)
    }
  } catch (e) {
    return { success: false, message: "Clinic locations must be a valid JSON array." }
  }

  const processedData = {
    ...brandData,
    to_emails: stringToArray(brandData.to_emails),
    cc_emails: stringToArray(brandData.cc_emails),
    bcc_emails: stringToArray(brandData.bcc_emails),
    clinic_locations: clinicLocationsData,
  }

  const query = id
    ? supabase.from("brands").update(processedData).eq("id", id)
    : supabase.from("brands").insert(processedData)

  const { error } = await query.select().single()

  if (error) {
    console.error("Error saving brand:", error)
    return { success: false, message: `Database error: ${error.message}` }
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: `Brand ${id ? "updated" : "created"} successfully.` }
}
