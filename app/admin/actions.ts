"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import * as cheerio from "cheerio"
import type { ProductItem } from "@/lib/types" // Changed import path

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
