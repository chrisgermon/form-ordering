"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import type { BrandData } from "@/lib/types"

export async function getBrand(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      product_sections (
        *,
        product_items (
          *
        )
      )
    `,
    )
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching brand:", error)
    return null
  }
  if (!data) return null

  // Sort sections and items by their order property
  const sortedSections = data.product_sections?.sort((a, b) => a.sort_order - b.sort_order) || []
  const sectionsWithSortedItems = sortedSections.map((section) => ({
    ...section,
    product_items: section.product_items?.sort((a, b) => a.sort_order - b.sort_order) || [],
  }))

  return { ...data, product_sections: sectionsWithSortedItems } as BrandData
}

export async function getUploadedFiles() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("uploaded_files").select("id, original_name, pathname")
  if (error) {
    console.error("Error fetching files:", error)
    return []
  }
  return data
}

export async function saveForm(prevState: any, formData: FormData) {
  const supabase = createAdminClient()

  const brandId = formData.get("id") as string
  const brandSlug = formData.get("slug") as string

  const brandUpdateData = {
    name: formData.get("name") as string,
    initials: formData.get("initials") as string,
    to_emails: formData.get("to_emails") as string,
    cc_emails: formData.get("cc_emails") as string,
    bcc_emails: formData.get("bcc_emails") as string,
    subject_line: formData.get("subject_line") as string,
    form_title: formData.get("form_title") as string,
    form_subtitle: formData.get("form_subtitle") as string,
    logo_url: formData.get("logo_url") as string,
    header_image_url: formData.get("header_image_url") as string,
  }

  const sectionsJson = formData.get("product_sections_json") as string
  const sectionsData = sectionsJson ? JSON.parse(sectionsJson) : []

  const { error } = await supabase.rpc("save_brand_form", {
    brand_id_in: brandId,
    brand_data: brandUpdateData,
    sections_data: sectionsData,
  })

  if (error) {
    console.error("Error saving form:", error)
    return { success: false, message: `Failed to save form: ${error.message}` }
  }

  revalidatePath(`/admin/editor/${brandSlug}`)
  revalidatePath(`/forms/${brandSlug}`)
  revalidatePath(`/admin/dashboard`)
  return { success: true, message: "Form saved successfully!" }
}
