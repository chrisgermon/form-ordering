"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { ClinicLocation } from "@/lib/types"
import { nanoid } from "nanoid"
import { put } from "@vercel/blob"
import { scrapeWebsiteWithAI, parseFormWithAI } from "@/lib/scraping"

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

export async function revalidateAllData() {
  try {
    // Revalidate the main pages and all admin API routes
    revalidatePath("/", "layout")
    revalidatePath("/admin")
    revalidatePath("/api/admin/brands")
    revalidatePath("/api/admin/files")
    revalidatePath("/api/admin/submissions")
    return { success: true, message: "Data revalidated successfully." }
  } catch (error) {
    console.error("Revalidation failed:", error)
    return { success: false, message: "An error occurred during revalidation." }
  }
}
