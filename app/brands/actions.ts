"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function createBrand(formData: FormData) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a brand." }
  }

  const brandData = {
    name: formData.get("name") as string,
    initials: formData.get("initials") as string,
    order_prefix: formData.get("order_prefix") as string,
    user_id: user.id,
  }

  const { error } = await supabase.from("brands").insert(brandData)

  if (error) {
    console.error("Error creating brand:", error)
    return { error: "Failed to create brand. Please try again." }
  }

  revalidatePath("/brands")
  return { error: null }
}
