"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Brand } from "@/lib/types"

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

export async function getBrandForEditor(slug: string): Promise<{ brand: Brand | null; error: string | null }> {
  const supabase = createClient()
  try {
    const { data: brand, error } = await supabase
      .from("brands")
      .select(
        `
        id,
        name,
        slug,
        logo,
        emails,
        active,
        sections (
          *,
          items:form_items (
            *,
            options (*)
          )
        )
      `,
      )
      .eq("slug", slug)
      .single()

    if (error) {
      console.error(`Database error fetching brand '${slug}' for editor:`, error.message)
      if (error.code === "PGRST116") {
        // "PGRST116" means no rows found
        return { brand: null, error: `No brand with the slug '${slug}' could be found. Please check the URL.` }
      }
      return { brand: null, error: "A database error occurred while fetching the brand. Please check the server logs." }
    }

    if (!brand) {
      return { brand: null, error: `No brand with the slug '${slug}' could be found. Please check the URL.` }
    }

    // Sort sections and items by the 'order' column
    const sortedSections = (brand.sections || []).sort((a, b) => a.order - b.order)
    sortedSections.forEach((section) => {
      if (section.items) {
        section.items.sort((a, b) => a.order - b.order)
        section.items.forEach((item) => {
          if (item.options) {
            item.options.sort((a, b) => a.sort_order - b.sort_order)
          }
        })
      }
    })

    const finalBrand = { ...brand, sections: sortedSections } as Brand
    return { brand: finalBrand, error: null }
  } catch (e: any) {
    console.error(`Unexpected error in getBrandForEditor for slug '${slug}':`, e.message)
    return { brand: null, error: "An unexpected server error occurred." }
  }
}

export async function addSection(brandId: number, title: string) {
  const supabase = createClient()
  try {
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from("sections")
      .select("order")
      .eq("brand_id", brandId)
      .order("order", { ascending: false })
      .limit(1)
      .single()

    if (maxOrderError && maxOrderError.code !== "PGRST116") {
      throw maxOrderError
    }

    const newOrder = (maxOrderData?.order ?? 0) + 1

    const { error } = await supabase.from("sections").insert({
      brand_id: brandId,
      title: title,
      slug: slugify(title),
      order: newOrder,
    })

    if (error) throw error

    revalidatePath(`/admin/editor/.*`, "layout")
    return { success: true, message: `Section "${title}" added successfully.` }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function clearForm(brandId: number) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("sections").delete().eq("brand_id", brandId)
    if (error) throw error

    revalidatePath(`/admin/editor/.*`, "layout")
    return { success: true, message: "Form has been cleared." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function importFormFromURL(brandId: number, url: string) {
  console.log(`Importing form for brand ${brandId} from ${url}`)
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return { success: true, message: "Import process started (placeholder)." }
}

export async function updateSectionOrder(brandId: number, sections: { id: number; order: number }[]) {
  const supabase = createClient()
  try {
    const updates = sections.map((section) =>
      supabase.from("sections").update({ order: section.order }).eq("id", section.id),
    )
    const results = await Promise.all(updates)
    const error = results.find((res) => res.error)
    if (error) throw error.error

    revalidatePath(`/admin/editor/.*`, "layout")
    return { success: true, message: "Section order saved." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateItemOrder(sectionId: number, items: { id: number; order: number }[]) {
  const supabase = createClient()
  try {
    const updates = items.map((item) => supabase.from("form_items").update({ order: item.order }).eq("id", item.id))
    const results = await Promise.all(updates)
    const error = results.find((res) => res.error)
    if (error) throw error.error

    revalidatePath(`/admin/editor/.*`, "layout")
    return { success: true, message: "Item order saved." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
