import { createAdminClient } from "@/lib/supabase/admin"
import type { Brand, BrandData, Submission, UploadedFile, AllowedIp } from "@/lib/types"

export async function getActiveBrands(): Promise<Pick<Brand, "id" | "name" | "slug" | "logo_url">[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, active")
      .eq("active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching active brands:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("Unexpected error in getActiveBrands:", error)
    return []
  }
}

export async function getAllBrands(): Promise<Brand[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("brands").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data || []
}

export async function getSubmissions(): Promise<Submission[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      id,
      created_at,
      ordered_by,
      email,
      status,
      pdf_url,
      ip_address,
      order_data,
      order_number,
      dispatch_date,
      tracking_link,
      dispatch_notes,
      brands (
        name
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching submissions:", error)
    return []
  }
  return (data as Submission[]) || []
}

export async function getUploadedFiles(brandId?: string): Promise<UploadedFile[]> {
  const supabase = createAdminClient()
  let query = supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false })

  if (brandId) {
    query = query.eq("brand_id", brandId)
  } else {
    query = query.is("brand_id", null)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching files:", error)
    return []
  }
  return data || []
}

export async function getAllowedIps(): Promise<AllowedIp[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("allowed_ips").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching allowed IPs:", error)
    return []
  }
  return data || []
}

export async function getBrandBySlug(slug: string): Promise<BrandData | null> {
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
    console.error(`Error fetching brand by slug ${slug}:`, error)
    return null
  }

  // Sort sections and items within sections
  if (data && data.product_sections) {
    data.product_sections.sort((a, b) => a.sort_order - b.sort_order)
    data.product_sections.forEach((section) => {
      if (section.product_items) {
        section.product_items.sort((a, b) => a.sort_order - b.sort_order)
      }
    })
  }

  return data as BrandData
}
