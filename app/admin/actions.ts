"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Clinic } from "@/lib/types"

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createBrand(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const name = formData.get("name") as string
  const clinicsData = formData.get("clinics") as string
  const clinics = clinicsData ? (JSON.parse(clinicsData) as Clinic[]) : []

  if (!name) {
    return { success: false, message: "Brand name is required." }
  }

  const newBrand = {
    name,
    slug: generateSlug(name),
    logo: formData.get("logo") as string,
    primary_color: formData.get("primary_color") as string,
    email: formData.get("email") as string,
    active: formData.get("active") === "true",
    clinics: clinics.filter((c) => c.name && c.address), // Filter out empty clinics
  }

  const { error } = await supabase.from("brands").insert(newBrand)

  if (error) {
    console.error("Error creating brand:", error)
    return { success: false, message: `Failed to create brand: ${error.message}` }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand created successfully." }
}

export async function updateBrand(id: string, formData: FormData) {
  const supabase = createServerSupabaseClient()
  const name = formData.get("name") as string
  const clinicsData = formData.get("clinics") as string
  const clinics = clinicsData ? (JSON.parse(clinicsData) as Clinic[]) : []

  if (!id || !name) {
    return { success: false, message: "Brand ID and name are required." }
  }

  const updatedBrand = {
    name,
    slug: generateSlug(name),
    logo: formData.get("logo") as string,
    primary_color: formData.get("primary_color") as string,
    email: formData.get("email") as string,
    active: formData.get("active") === "true",
    clinics: clinics.filter((c) => c.name && c.address),
  }

  const { error } = await supabase.from("brands").update(updatedBrand).eq("id", id)

  if (error) {
    console.error("Error updating brand:", error)
    return { success: false, message: `Failed to update brand: ${error.message}` }
  }

  revalidatePath("/admin")
  revalidatePath(`/forms/${updatedBrand.slug}`)
  return { success: true, message: "Brand updated successfully." }
}

export async function deleteBrand(id: string) {
  const supabase = createServerSupabaseClient()
  if (!id) {
    return { success: false, message: "Brand ID is required." }
  }

  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    console.error("Error deleting brand:", error)
    return { success: false, message: `Failed to delete brand: ${error.message}` }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand deleted successfully." }
}

export async function runSeedProductData() {
  try {
    const supabase = createServerSupabaseClient()
    console.log("--- Seeding Product and Section Data ---")

    const { data: brandData, error: brandFetchError } = await supabase.from("brands").select("id, slug")
    if (brandFetchError || !brandData) {
      throw new Error("Could not fetch brand data for seeding.")
    }
    const brandMap = brandData.reduce(
      (acc, brand) => ({ ...acc, [brand.slug]: brand.id }),
      {} as Record<string, string>,
    )

    // Clear existing product data
    await supabase.from("product_items").delete().neq("id", "0")
    await supabase.from("product_sections").delete().neq("id", "0")
    console.log("Cleared existing product and section data.")

    // --- SEED VISION RADIOLOGY ---
    if (brandMap["vision-radiology"]) {
      const brand_id = brandMap["vision-radiology"]
      const visionFormData = [
        {
          section: { title: "OPERATIONAL AND PATIENT BROCHURES", sort_order: 0 },
          items: [
            {
              code: "VR-LAB",
              name: "LABELS",
              description: "1000 per box (A5 generic)",
              quantities: ["6 boxes", "10 boxes", "16 boxes", "other"],
              sort_order: 0,
            },
            {
              code: "VR-LH",
              name: "LETTERHEAD",
              description: "1000 per box (site specific)",
              quantities: ["1 box", "2 boxes", "4 boxes", "other"],
              sort_order: 1,
            },
            {
              code: "VR-AC",
              name: "APPOINTMENT CARDS",
              description: "250 per box (site specific)",
              quantities: ["1 box", "2 boxes", "4 boxes", "other"],
              sort_order: 2,
            },
          ],
        },
      ]
      for (const { section, items } of visionFormData) {
        const { data: newSection } = await supabase
          .from("product_sections")
          .insert({ ...section, brand_id })
          .select("id")
          .single()
        if (newSection) {
          await supabase
            .from("product_items")
            .insert(items.map((item) => ({ ...item, section_id: newSection.id, brand_id })))
        }
      }
      console.log("✅ Seeded Vision Radiology product data.")
    }

    // Add other brands' product data here...

    revalidatePath("/admin", "layout")
    revalidatePath("/forms", "layout")
    return { success: true, message: "Product data seeded successfully!" }
  } catch (error) {
    console.error("Error seeding product data:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to seed product data: ${errorMessage}` }
  }
}

export async function autoAssignPdfs() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: files, error: filesError } = await supabase
      .from("uploaded_files")
      .select("id, original_name, url")
      .ilike("original_name", "%.pdf")
    if (filesError) throw filesError
    const { data: items, error: itemsError } = await supabase.from("product_items").select("id, code")
    if (itemsError) throw itemsError

    const itemCodeMap = new Map(items.map((item) => [item.code.toUpperCase(), item.id]))
    const updatePromises = []
    let updatedCount = 0
    const unmatchedFiles = []

    for (const file of files) {
      const fileCode = file.original_name.replace(/\.pdf$/i, "").toUpperCase()
      if (itemCodeMap.has(fileCode)) {
        const itemId = itemCodeMap.get(fileCode)
        updatePromises.push(supabase.from("product_items").update({ sample_link: file.url }).eq("id", itemId))
        updatedCount++
      } else {
        unmatchedFiles.push(file.original_name)
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }

    revalidatePath("/admin", "layout")
    revalidatePath("/forms", "layout")
    let message = `${updatedCount} PDF(s) were successfully assigned.`
    if (unmatchedFiles.length > 0) {
      message += ` The following files could not be matched: ${unmatchedFiles.join(", ")}.`
    }
    return { success: true, message }
  } catch (error) {
    console.error("Error auto-assigning PDFs:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to assign PDFs: ${errorMessage}` }
  }
}
