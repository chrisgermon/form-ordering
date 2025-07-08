"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import type { BrandData } from "@/lib/types"
import { z } from "zod"

const brandFormSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().min(1, "Brand name is required"),
  initials: z.string().min(1, "Brand initials are required"),
  to_emails: z.string().optional(),
  cc_emails: z.string().optional(),
  bcc_emails: z.string().optional(),
  subject_line: z.string().optional(),
  form_title: z.string().optional(),
  form_subtitle: z.string().optional(),
  logo_url: z.string().optional().nullable(),
  header_image_url: z.string().optional().nullable(),
  product_sections: z.array(z.any()).optional(),
})

export async function saveFormAction(
  formData: z.infer<typeof brandFormSchema>,
): Promise<{ success: boolean; message: string }> {
  const supabase = createAdminClient()

  const validation = brandFormSchema.safeParse(formData)
  if (!validation.success) {
    console.error("Invalid form data received by server action:", validation.error.flatten())
    return { success: false, message: "Invalid data submitted. Please check the form for errors." }
  }

  const { id: brandId, slug: brandSlug, product_sections, ...brandCoreData } = validation.data

  const stringToArray = (str: string | null | undefined): string[] => {
    if (!str) return []
    return str
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0 && /.+@.+\..+/.test(email))
  }

  const brandUpdateData = {
    name: brandCoreData.name,
    initials: brandCoreData.initials,
    to_emails: stringToArray(brandCoreData.to_emails),
    cc_emails: stringToArray(brandCoreData.cc_emails),
    bcc_emails: stringToArray(brandCoreData.bcc_emails),
    subject_line: brandCoreData.subject_line,
    form_title: brandCoreData.form_title,
    form_subtitle: brandCoreData.form_subtitle,
    logo_url: brandCoreData.logo_url,
    header_image_url: brandCoreData.header_image_url,
  }

  const sectionsData = product_sections || []
  sectionsData.forEach((section, sectionIndex) => {
    section.sort_order = section.sort_order ?? sectionIndex
    section.product_items?.forEach((item: any, itemIndex: number) => {
      item.sort_order = item.sort_order ?? itemIndex
    })
  })

  try {
    const { error } = await supabase.rpc("save_brand_form", {
      brand_id_in: brandId,
      brand_data: brandUpdateData,
      sections_data: sectionsData,
    })

    if (error) {
      throw error
    }

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    revalidatePath(`/admin/dashboard`)
    return { success: true, message: "Form saved successfully!" }
  } catch (error: any) {
    console.error("Error saving form via RPC:", error)
    return { success: false, message: `Failed to save form: ${error.message}` }
  }
}

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
