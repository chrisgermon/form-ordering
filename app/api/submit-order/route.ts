import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { generateOrderEmailTemplate } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form data
    const brandSlug = formData.get("brand") as string
    const orderedBy = formData.get("ordered_by") as string
    const deliverTo = formData.get("deliver_to") as string
    const specialInstructions = formData.get("special_instructions") as string

    // Parse items from form data
    const items: Array<{
      name: string
      quantity: string
      description?: string
      sample_link?: string
    }> = []

    const attachments: File[] = []

    // Process form entries
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("item_")) {
        const itemName = key.replace("item_", "")
        if (value && value !== "") {
          items.push({
            name: itemName,
            quantity: value as string,
          })
        }
      } else if (key.startsWith("attachment_")) {
        if (value instanceof File && value.size > 0) {
          attachments.push(value)
        }
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Get brand information
    const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("slug", brandSlug).single()

    if (brandError || !brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Create submission record
    const submissionData = {
      brand_id: brand.id,
      ordered_by: orderedBy,
      deliver_to: deliverTo,
      special_instructions: specialInstructions || null,
      items: items,
      status: "pending" as const,
    }

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert(submissionData)
      .select()
      .single()

    if (submissionError) {
      console.error("Error creating submission:", submissionError)
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    // Generate and send email
    try {
      const emailData = {
        brand,
        submission: {
          ...submission,
          items,
        },
        attachments,
      }

      const emailHtml = generateOrderEmailTemplate(emailData)

      // Here you would send the email using your preferred email service
      // For now, we'll just log it
      console.log("Email would be sent:", {
        to: brand.email,
        subject: `New Order from ${orderedBy}`,
        html: emailHtml,
        attachments: attachments.map((f) => f.name),
      })
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    })
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 })
  }
}

// Export named function for compatibility
export const submitOrder = POST
