"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const brandSchema = z.object({
  name: z.string().min(1, { message: "Must be at least 1 character" }),
})

export async function createBrand(prevState: any, formData: FormData) {
  const supabase = createServerSupabaseClient()

  const validatedFields = brandSchema.safeParse({
    name: formData.get("name"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to create brand.",
    }
  }

  const { data, error } = await supabase.from("brands").insert({ name: validatedFields.data.name }).select().single()

  if (error) {
    return {
      message: "Failed to create brand.",
    }
  }

  revalidatePath("/admin/brands")
  redirect("/admin/brands")
}

export async function updateBrand(id: string, prevState: any, formData: FormData) {
  const supabase = createServerSupabaseClient()

  const validatedFields = brandSchema.safeParse({
    name: formData.get("name"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update brand.",
    }
  }

  const { data, error } = await supabase
    .from("brands")
    .update({ name: validatedFields.data.name })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return {
      message: "Failed to update brand.",
    }
  }

  revalidatePath("/admin/brands")
  redirect("/admin/brands")
}

export async function deleteBrand(id: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    return {
      message: "Failed to delete brand.",
    }
  }

  revalidatePath("/admin/brands")
}
