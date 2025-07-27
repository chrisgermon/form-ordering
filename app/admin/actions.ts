"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { seedData } from "@/lib/seed-data"
import { z } from "zod"

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  recipient_email: z.string().email("Must be a valid email address"),
  is_active: z.boolean(),
  clinics: z
    .array(
      z.object({
        name: z.string().min(1, "Clinic name cannot be empty"),
        address: z.string().min(1, "Clinic address cannot be empty"),
      }),
    )
    .optional(),
})

export async function createBrand(formData: FormData) {
  const supabase = createClient()
  const values = Object.fromEntries(formData.entries())

  const parsedValues = {
    ...values,
    is_active: values.is_active === "true",
    clinics: values.clinics ? JSON.parse(values.clinics as string) : [],
  }

  const validatedFields = brandSchema.safeParse(parsedValues)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { clinics, ...brandData } = validatedFields.data

  const { error } = await supabase.from("brands").insert([
    {
      ...brandData,
      slug: brandData.name.toLowerCase().replace(/\s+/g, "-"),
      clinics: clinics || [],
    },
  ])

  if (error) {
    return { success: false, message: `Database error: ${error.message}` }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand created successfully." }
}

export async function updateBrand(id: number, formData: FormData) {
  const supabase = createClient()
  const values = Object.fromEntries(formData.entries())

  const parsedValues = {
    ...values,
    is_active: values.is_active === "true",
    clinics: values.clinics ? JSON.parse(values.clinics as string) : [],
  }

  const validatedFields = brandSchema.safeParse(parsedValues)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { clinics, ...brandData } = validatedFields.data

  const { data, error } = await supabase
    .from("brands")
    .update({
      ...brandData,
      slug: brandData.name.toLowerCase().replace(/\s+/g, "-"),
      clinics: clinics || [],
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, message: `Database error: ${error.message}` }
  }

  revalidatePath("/admin")
  revalidatePath(`/forms/${data.slug}`)
  return { success: true, message: "Brand updated successfully." }
}

export async function deleteBrand(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    return { success: false, message: `Database error: ${error.message}` }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand deleted successfully." }
}

export async function seedDatabase() {
  const supabase = createClient()
  try {
    await seedData(supabase)
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully." }
  } catch (error: any) {
    console.error("Error seeding database:", error)
    return { success: false, message: `Failed to seed database: ${error.message}` }
  }
}
