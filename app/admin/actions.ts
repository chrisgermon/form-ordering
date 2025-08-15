"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkUserPermissions } from "@/lib/utils"

export async function seedDatabase() {
  const supabase = createClient()
  await checkUserPermissions(supabase)

  try {
    // Create sample brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .insert([
        {
          name: "Focus Radiology",
          slug: "focus-radiology",
          logo_url: "/images/focus-radiology-logo.png",
          primary_color: "#2563eb",
          secondary_color: "#1e40af",
          clinics: [
            {
              id: "1",
              name: "Focus Radiology Main",
              address: "123 Medical Center Dr, City, State 12345",
              phone: "(555) 123-4567",
              email: "info@focusradiology.com",
            },
          ],
        },
        {
          name: "Vision Radiology",
          slug: "vision-radiology",
          logo_url: "/vision-radiology-logo.svg",
          primary_color: "#059669",
          secondary_color: "#047857",
          clinics: [
            {
              id: "2",
              name: "Vision Radiology Center",
              address: "456 Healthcare Blvd, City, State 12345",
              phone: "(555) 987-6543",
              email: "contact@visionradiology.com",
            },
          ],
        },
      ])
      .select()

    if (brandsError) throw brandsError

    // Create sample sections and items for each brand
    for (const brand of brands) {
      const { data: sections, error: sectionsError } = await supabase
        .from("sections")
        .insert([
          {
            brand_id: brand.id,
            title: "Patient Information",
            description: "Basic patient details",
            order: 1,
          },
          {
            brand_id: brand.id,
            title: "Exam Details",
            description: "Examination requirements",
            order: 2,
          },
        ])
        .select()

      if (sectionsError) throw sectionsError

      // Add items to sections
      const patientSection = sections.find((s) => s.title === "Patient Information")
      const examSection = sections.find((s) => s.title === "Exam Details")

      if (patientSection) {
        await supabase.from("items").insert([
          {
            section_id: patientSection.id,
            title: "Patient Name",
            type: "text",
            required: true,
            order: 1,
          },
          {
            section_id: patientSection.id,
            title: "Date of Birth",
            type: "date",
            required: true,
            order: 2,
          },
          {
            section_id: patientSection.id,
            title: "Phone Number",
            type: "text",
            required: true,
            order: 3,
          },
        ])
      }

      if (examSection) {
        await supabase.from("items").insert([
          {
            section_id: examSection.id,
            title: "Exam Type",
            type: "select",
            options: ["X-Ray", "MRI", "CT Scan", "Ultrasound"],
            required: true,
            order: 1,
          },
          {
            section_id: examSection.id,
            title: "Urgent",
            type: "checkbox",
            required: false,
            order: 2,
          },
          {
            section_id: examSection.id,
            title: "Additional Notes",
            type: "textarea",
            required: false,
            order: 3,
          },
        ])
      }
    }

    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: "Failed to seed database" }
  }
}

export async function deleteBrand(brandId: string) {
  const supabase = createClient()
  await checkUserPermissions(supabase)

  try {
    const { error } = await supabase.from("brands").delete().eq("id", brandId)

    if (error) throw error

    revalidatePath("/admin")
    return { success: true, message: "Brand deleted successfully" }
  } catch (error) {
    console.error("Error deleting brand:", error)
    return { success: false, message: "Failed to delete brand" }
  }
}

export async function updateBrand(brandId: string, formData: FormData) {
  const supabase = createClient()
  await checkUserPermissions(supabase)

  try {
    const name = formData.get("name") as string
    const slug = formData.get("slug") as string
    const primaryColor = formData.get("primaryColor") as string
    const secondaryColor = formData.get("secondaryColor") as string
    const logoUrl = formData.get("logoUrl") as string

    const { error } = await supabase
      .from("brands")
      .update({
        name,
        slug,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId)

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath(`/admin/editor/${slug}`)
    return { success: true, message: "Brand updated successfully" }
  } catch (error) {
    console.error("Error updating brand:", error)
    return { success: false, message: "Failed to update brand" }
  }
}
