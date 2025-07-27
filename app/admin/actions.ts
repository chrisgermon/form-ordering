"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Brand } from "@/lib/types"
import type { brandFormSchema } from "./BrandEditor"
import type { z } from "zod"

type BrandFormValues = z.infer<typeof brandFormSchema>

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createBrand(values: BrandFormValues) {
  const supabase = createServerSupabaseClient()

  const newBrand = {
    ...values,
    slug: generateSlug(values.name),
    clinics: values.clinics.filter((c) => c.name && c.address),
  }

  const { error } = await supabase.from("brands").insert(newBrand)

  if (error) {
    console.error("Error creating brand:", error)
    return { success: false, message: `Failed to create brand: ${error.message}` }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand created successfully." }
}

export async function updateBrand(id: string, values: BrandFormValues) {
  const supabase = createServerSupabaseClient()

  const updatedBrand = {
    ...values,
    slug: generateSlug(values.name),
    clinics: values.clinics.filter((c) => c.name && c.address),
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

export async function seedDatabase() {
  try {
    const supabase = createServerSupabaseClient()
    console.log("--- Starting Full Database Seed ---")

    // Clear existing data
    console.log("Clearing existing data...")
    await supabase.from("product_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("product_sections").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("brands").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    console.log("✅ Data cleared.")

    // Seed Brands
    console.log("Seeding brands...")
    const brandsToSeed: Omit<Brand, "id" | "created_at">[] = [
      {
        name: "Vision Radiology",
        slug: "vision-radiology",
        logo: "/vision-radiology-logo.svg",
        active: true,
        primary_color: "#1e40af",
        email: "orders@visionradiology.com.au",
        clinics: [{ name: "Main Clinic", address: "123 Vision St, Melbourne" }],
      },
      {
        name: "Light Radiology",
        slug: "light-radiology",
        logo: "/light-radiology-logo.svg",
        active: true,
        primary_color: "#059669",
        email: "orders@lightradiology.com.au",
        clinics: [{ name: "Sunshine Clinic", address: "456 Light Ave, Brisbane" }],
      },
      {
        name: "Focus Radiology",
        slug: "focus-radiology",
        logo: "/images/focus-radiology-logo.png",
        active: true,
        primary_color: "#dc2626",
        email: "orders@focusradiology.com.au",
        clinics: [{ name: "City Imaging", address: "789 Focus Rd, Sydney" }],
      },
      {
        name: "Quantum Medical Imaging",
        slug: "quantum-medical-imaging",
        logo: "https://www.jotform.com/uploads/Germon/form_files/Quantum-Imaging-Logo.67ce57124c7890.77397803-removebg-preview.67d52f7359e367.05025068.png",
        active: true,
        primary_color: "#2a3760",
        email: "orders@quantummedical.com.au",
        clinics: [{ name: "Quantum HQ", address: "101 Quantum Blvd, Perth" }],
      },
    ]
    const { error: brandInsertError } = await supabase.from("brands").insert(brandsToSeed)
    if (brandInsertError) throw new Error(`Brand seeding failed: ${brandInsertError.message}`)
    console.log("✅ Brands seeded.")

    // Fetch seeded brands to get their IDs
    const { data: seededBrands, error: brandFetchError } = await supabase.from("brands").select("id, slug")
    if (brandFetchError) throw new Error("Could not fetch seeded brands.")
    const brandMap = new Map(seededBrands.map((b) => [b.slug, b.id]))

    // Seed Product Data for each brand
    console.log("Seeding product data...")

    // Vision Radiology Data
    const visionBrandId = brandMap.get("vision-radiology")
    if (visionBrandId) {
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
          ],
        },
      ]
      for (const { section, items } of visionFormData) {
        const { data: newSection } = await supabase
          .from("product_sections")
          .insert({ ...section, brand_id: visionBrandId })
          .select("id")
          .single()
        if (newSection) {
          await supabase
            .from("product_items")
            .insert(items.map((item) => ({ ...item, section_id: newSection.id, brand_id: visionBrandId })))
        }
      }
      console.log("✅ Seeded Vision Radiology products.")
    }

    // Quantum Medical Imaging Data
    const quantumBrandId = brandMap.get("quantum-medical-imaging")
    if (quantumBrandId) {
      const quantumFormData = [
        {
          section: { title: "OPERATIONAL AND PATIENT BROCHURES", sort_order: 0 },
          items: [
            {
              code: "QMI-A5LAB",
              name: "LABELS",
              description: "1000 per box",
              quantities: ["6 boxes", "10 boxes", "16 boxes", "other"],
              sort_order: 0,
            },
            {
              code: "QMI-A4LET",
              name: "LETTERHEAD",
              description: "2000 per box",
              quantities: ["1 box", "2 boxes", "4 boxes", "other"],
              sort_order: 1,
            },
          ],
        },
        {
          section: { title: "REFERRALS", sort_order: 1 },
          items: [
            {
              code: "QMI-A4REF",
              name: "A4 REFERRAL (with wrapping)",
              description: "20 packs of 100 per box (with wrapping)",
              quantities: ["3 boxes", "6 boxes", "9 boxes", "other"],
              sort_order: 0,
            },
          ],
        },
      ]
      for (const { section, items } of quantumFormData) {
        const { data: newSection } = await supabase
          .from("product_sections")
          .insert({ ...section, brand_id: quantumBrandId })
          .select("id")
          .single()
        if (newSection) {
          await supabase
            .from("product_items")
            .insert(items.map((item) => ({ ...item, section_id: newSection.id, brand_id: quantumBrandId })))
        }
      }
      console.log("✅ Seeded Quantum Medical Imaging products.")
    }

    // Add other brand data similarly...

    console.log("--- Database Seed Complete ---")
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Error seeding database:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to seed database: ${errorMessage}` }
  }
}
