"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { ActionPayload } from "@/lib/types"

export async function submitOrder(prevState: any, formData: FormData) {
  console.log("--- SERVER ACTION: PROCESSING SUBMISSION ---")
  const supabase = createClient()

  try {
    // 1. Extract and validate data from FormData
    const items: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("item-")) {
        items[key.replace("item-", "")] = value.toString()
      }
    }

    const payload: ActionPayload = {
      brandSlug: formData.get("brandSlug") as string,
      orderedBy: formData.get("orderedBy") as string,
      email: formData.get("email") as string,
      billToId: formData.get("billToId") as string,
      deliverToId: formData.get("deliverToId") as string,
      notes: formData.get("notes") as string,
      items: items,
    }

    if (!payload.orderedBy || !payload.email || !payload.billToId || !payload.deliverToId) {
      throw new Error("Required fields are missing.")
    }

    // 2. Get Brand ID
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", payload.brandSlug)
      .single()
    if (brandError) throw new Error("Brand could not be found.")

    // 3. Insert submission
    const { error: submissionError } = await supabase.from("submissions").insert({
      brand_id: brand.id,
      ordered_by: payload.orderedBy,
      email: payload.email,
      bill_to_id: payload.billToId,
      deliver_to_id: payload.deliverToId,
      notes: payload.notes,
      form_data: payload.items, // Store the raw items object
    })

    if (submissionError) {
      console.error("DB Submission Error:", submissionError)
      throw new Error("Failed to save your order to the database.")
    }

    // 4. Revalidate paths and return success
    revalidatePath(`/forms/${payload.brandSlug}`)
    return { success: true, message: "Order submitted successfully!" }
  } catch (error: any) {
    console.error("Full Server Action Error:", error)
    return { success: false, message: error.message || "An unexpected error occurred." }
  }
}
