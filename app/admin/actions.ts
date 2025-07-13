"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { put, del } from "@vercel/blob"
import type { Brand } from "@/lib/types"
import { parseFormWithAI, scrapeWebsiteWithAI } from "@/lib/scraping"
import { nanoid } from "nanoid"
import slugify from "slugify"

type FormState = {
  message: string
  errors?: Record<string, string> | null
  success: boolean
  brand?: Brand
}

// Brand Management Actions
export async function createBrand(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient()
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const logoFile = formData.get("logo") as File

  if (!name || !slug) {
    return { message: "Name and slug are required.", success: false }
  }

  let logoUrl: string | null = null
  if (logoFile && logoFile.size > 0) {
    try {
      const blob = await put(`logos/${slug}/${logoFile.name}`, logoFile, {
        access: "public",
      })
      logoUrl = blob.url
    } catch (error) {
      console.error("Error uploading logo:", error)
      return { message: "Failed to upload logo.", success: false }
    }
  }

  const { data, error } = await supabase
    .from("brands")
    .insert([{ name, slug, logo: logoUrl }])
    .select()
    .single()

  if (error) {
    console.error("Error creating brand:", error)
    return { message: error.message, success: false }
  }

  revalidatePath("/admin")
  return {
    message: `Brand "${data.name}" created successfully.`,
    success: true,
    brand: data,
  }
}

export async function updateBrand(id: number, prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient()
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const logoFile = formData.get("logo") as File

  const { data: existingBrand } = await supabase.from("brands").select("logo").eq("id", id).single()

  if (!existingBrand) {
    return { message: "Brand not found.", success: false }
  }

  let logoUrl: string | null = existingBrand.logo
  if (logoFile && logoFile.size > 0) {
    try {
      if (existingBrand.logo) {
        await del(existingBrand.logo)
      }
      const blob = await put(`logos/${slug}/${logoFile.name}`, logoFile, {
        access: "public",
      })
      logoUrl = blob.url
    } catch (error) {
      console.error("Error uploading new logo:", error)
      return { message: "Failed to upload new logo.", success: false }
    }
  }

  const { data, error } = await supabase
    .from("brands")
    .update({ name, slug, logo: logoUrl })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating brand:", error)
    return { message: error.message, success: false }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/editor/${slug}`)
  return {
    message: `Brand "${data.name}" updated successfully.`,
    success: true,
    brand: data,
  }
}

export async function deleteBrand(id: number) {
  const supabase = createClient()

  const { data: brand, error: fetchError } = await supabase.from("brands").select("logo").eq("id", id).single()

  if (fetchError || !brand) {
    console.error("Error fetching brand for deletion:", fetchError)
    return { error: "Could not find brand to delete." }
  }

  if (brand.logo) {
    try {
      await del(brand.logo)
    } catch (error) {
      console.error("Could not delete logo from blob storage:", error)
    }
  }

  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    console.error("Error deleting brand:", error)
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

// Form Management Actions
export async function importForm(
  brandId: string,
  brandSlug: string,
  { htmlCode, url }: { htmlCode?: string; url?: string },
) {
  const supabase = createClient()

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

    await supabase.from("items").delete().eq("brand_id", brandId)
    await supabase.from("sections").delete().eq("brand_id", brandId)

    for (const [sectionIndex, section] of parsedForm.sections.entries()) {
      const { data: newSection, error: sectionError } = await supabase
        .from("sections")
        .insert({
          brand_id: brandId,
          title: section.title,
          position: sectionIndex,
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
          position: itemIndex,
        }))

        const { error: itemsError } = await supabase.from("items").insert(itemsToInsert)
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
  const supabase = createClient()
  try {
    await supabase.from("items").delete().eq("brand_id", brandId)
    const { error } = await supabase.from("sections").delete().eq("brand_id", brandId)
    if (error) throw error

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    return { success: true, message: "Form has been cleared successfully." }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    console.error("Error clearing form:", errorMessage)
    return { success: false, message: `Failed to clear form: ${errorMessage}` }
  }
}

// General Actions
export async function revalidateAllData() {
  try {
    revalidatePath("/", "layout")
    return { success: true, message: "Data revalidated successfully." }
  } catch (error) {
    console.error("Revalidation failed:", error)
    return { success: false, message: "An error occurred during revalidation." }
  }
}

// Scraping and Data Fetching
async function uploadLogoFromUrl(logoUrl: string, brandSlug: string): Promise<string | null> {
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.error(`Failed to fetch logo image: ${response.statusText}`)
      return null
    }
    const imageBlob = await response.blob()
    const originalName = new URL(logoUrl).pathname.split("/").pop() || `logo-${nanoid(5)}`
    const filename = `logos/${brandSlug}-${Date.now()}-${originalName}`

    const { url } = await put(filename, imageBlob, {
      access: "public",
    })

    return url
  } catch (error) {
    console.error("Error uploading logo:", error)
    return null
  }
}

export async function fetchBrandData(url: string) {
  try {
    const scrapedData = await scrapeWebsiteWithAI(url)
    const brandSlug = slugify(scrapedData.companyName || nanoid(8), { lower: true, strict: true })

    let uploadedLogoUrl: string | null = null
    if (scrapedData.logoUrl) {
      uploadedLogoUrl = await uploadLogoFromUrl(scrapedData.logoUrl, brandSlug)
    }

    return {
      success: true,
      data: {
        name: scrapedData.companyName || "",
        slug: brandSlug,
        logo: uploadedLogoUrl,
        locations: scrapedData.locations || [],
        emails: scrapedData.emails || [],
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("Failed to fetch brand data with AI:", errorMessage)
    return { success: false, error: `AI scraping failed: ${errorMessage}` }
  }
}
