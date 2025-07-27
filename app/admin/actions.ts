"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { seedData } from "@/lib/seed-data"
import { slugify } from "@/lib/utils"
import type { Brand, Clinic } from "@/lib/types"

export async function seedDatabase() {
  const supabase = createClient()
  try {
    for (const brand of seedData) {
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .upsert(
          {
            name: brand.name,
            slug: brand.slug,
            logo_url: brand.logo_url,
            is_active: brand.is_active,
            clinics: brand.clinics,
            primary_color: brand.primary_color,
            secondary_color: brand.secondary_color,
            recipient_email: brand.recipient_email,
          },
          { onConflict: "slug" },
        )
        .select()
        .single()

      if (brandError) {
        console.error(`Error seeding brand ${brand.name}:`, brandError)
        continue
      }

      if (brandData) {
        const brandId = brandData.id

        // Clear existing sections and items for this brand to avoid duplicates
        await supabase.from("product_items").delete().eq("brand_id", brandId)
        await supabase.from("product_sections").delete().eq("brand_id", brandId)

        let sectionOrder = 0
        for (const section of brand.sections) {
          const { data: sectionData, error: sectionError } = await supabase
            .from("product_sections")
            .insert({
              title: section.title,
              brand_id: brandId,
              sort_order: sectionOrder++,
            })
            .select()
            .single()

          if (sectionError) {
            console.error(`Error seeding section ${section.title} for brand ${brand.name}:`, sectionError)
            continue
          }

          if (sectionData) {
            const sectionId = sectionData.id
            let itemOrder = 0
            const itemsToInsert = section.items.map((item) => ({
              ...item,
              brand_id: brandId,
              section_id: sectionId,
              sort_order: itemOrder++,
            }))

            const { error: itemError } = await supabase.from("product_items").insert(itemsToInsert)

            if (itemError) {
              console.error(`Error seeding items for section ${section.title}:`, itemError)
            }
          }
        }
      }
    }
    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Error seeding database:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to seed database: ${errorMessage}` }
  }
}

export async function createBrand(formData: FormData): Promise<{ success: boolean; message: string; brand?: Brand }> {
  const name = formData.get("name") as string
  if (!name) {
    return { success: false, message: "Brand name is required." }
  }

  const supabase = createClient()
  const slug = slugify(name)

  const { data, error } = await supabase.from("brands").insert({ name, slug, is_active: false }).select().single()

  if (error) {
    console.error("Error creating brand:", error)
    return { success: false, message: "Failed to create brand. The name may already exist." }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand created successfully.", brand: data }
}

export async function updateBrand(formData: FormData): Promise<{ success: boolean; message: string }> {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const logo = formData.get("logo_url") as string
  const isActive = formData.get("is_active") === "true"
  const clinicsString = formData.get("clinics") as string
  const primaryColor = formData.get("primary_color") as string
  const secondaryColor = formData.get("secondary_color") as string
  const recipientEmail = formData.get("recipient_email") as string

  if (!id || !name) {
    return { success: false, message: "Brand ID and name are required." }
  }

  let clinics: Clinic[] = []
  try {
    if (clinicsString) {
      clinics = JSON.parse(clinicsString)
    }
  } catch (e) {
    return { success: false, message: "Invalid format for clinics. Please use valid JSON." }
  }

  const supabase = createClient()
  const slug = slugify(name)

  const { error } = await supabase
    .from("brands")
    .update({
      name,
      slug,
      logo_url: logo,
      is_active: isActive,
      clinics: clinics,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      recipient_email: recipientEmail,
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating brand:", error)
    return { success: false, message: "Failed to update brand." }
  }

  revalidatePath("/admin")
  revalidatePath(`/forms/${slug}`)
  return { success: true, message: "Brand updated successfully." }
}

export async function deleteBrand(id: number): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    console.error("Supabase error deleting brand:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand deleted successfully." }
}
