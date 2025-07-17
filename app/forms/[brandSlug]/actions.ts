"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { generatePDF } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"

interface OrderInfo {
  orderedBy: string
  email: string
  billToId: string
  deliverToId: string
  notes?: string
}

interface SubmitOrderParams {
  brandSlug: string
  orderInfo: OrderInfo
  items: Record<string, any>
}

export async function submitOrder(prevState: any, formData: FormData) {
  console.log("=== SUBMIT ORDER ACTION START ===")

  try {
    const supabase = createClient()

    // Extract form data
    const brandSlug = String(formData.get("brandSlug") || "")
    const orderedBy = String(formData.get("orderedBy") || "")
    const email = String(formData.get("email") || "")
    const deliverTo = String(formData.get("deliverTo") || "")
    const billTo = String(formData.get("billTo") || "")
    const notes = String(formData.get("notes") || "")

    console.log("Form data extracted:", {
      brandSlug,
      orderedBy,
      email,
      deliverTo,
      billTo,
      notes,
    })

    // Validate required fields
    if (!brandSlug || !orderedBy || !email || !deliverTo || !billTo) {
      console.error("Missing required fields")
      return {
        error: "Please fill in all required fields",
      }
    }

    // Get brand
    const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("slug", brandSlug).single()

    if (brandError || !brand) {
      console.error("Brand not found:", brandError)
      return {
        error: "Brand not found",
      }
    }

    // Create order submission
    const { data: submission, error: submissionError } = await supabase
      .from("order_submissions")
      .insert({
        brand_id: brand.id,
        ordered_by: orderedBy,
        email: email,
        deliver_to_id: deliverTo,
        bill_to_id: billTo,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single()

    if (submissionError || !submission) {
      console.error("Failed to create submission:", submissionError)
      return {
        error: "Failed to create order submission",
      }
    }

    console.log("Order submission created:", submission.id)

    // Process quantity items
    const items = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("quantity-") && value && Number(value) > 0) {
        const itemId = key.replace("quantity-", "")
        const quantity = Number(value)

        items.push({
          submission_id: submission.id,
          item_id: itemId,
          quantity: quantity,
        })
      }
    }

    console.log("Items to insert:", items)

    // Insert order items
    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("order_items").insert(items)

      if (itemsError) {
        console.error("Failed to insert order items:", itemsError)
        return {
          error: "Failed to save order items",
        }
      }
    }

    // Generate PDF and send email
    try {
      const pdfBuffer = await generatePDF(submission.id)
      await sendOrderEmail(submission.id, pdfBuffer)
      console.log("PDF generated and email sent successfully")
    } catch (error) {
      console.error("Failed to generate PDF or send email:", error)
      // Don't fail the entire submission for this
    }

    console.log("=== SUBMIT ORDER ACTION SUCCESS ===")

    // Redirect to success page
    redirect(`/forms/${brandSlug}/success?orderId=${submission.id}`)
  } catch (error) {
    console.error("=== SUBMIT ORDER ACTION ERROR ===", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
