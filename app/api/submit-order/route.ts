import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendOrderEmail } from "@/lib/email"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received form data:", {
      brandId: body.brandId,
      brandName: body.brandName,
      brandEmail: body.brandEmail,
      itemsCount: Object.keys(body.items || {}).length,
    })

    const { brandId, brandName, brandEmail, orderedBy, email, phone, billTo, deliverTo, specialInstructions, items } =
      body

    // Validate required fields
    if (!brandId || !orderedBy || !email || !billTo || !deliverTo) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    if (!items || Object.keys(items).length === 0) {
      return NextResponse.json({ success: false, message: "No items selected" }, { status: 400 })
    }

    console.log("Generating PDF...")

    // Generate PDF content
    const pdfContent = generatePDFContent({
      brandName,
      orderedBy,
      email,
      phone,
      billTo,
      deliverTo,
      specialInstructions,
      items,
    })

    console.log("Uploading PDF to blob storage...")

    // Upload PDF to Vercel Blob
    const pdfBlob = await put(`${brandId}-order-${Date.now()}.pdf`, Buffer.from(pdfContent), {
      access: "public",
      contentType: "application/pdf",
    })

    console.log("PDF uploaded successfully:", pdfBlob.url)

    console.log("Creating submission record...")

    // Save to database
    const supabase = createServerSupabaseClient()
    const { data: submission, error: dbError } = await supabase
      .from("order_submissions")
      .insert({
        brand_id: brandId,
        ordered_by: orderedBy,
        email,
        phone,
        bill_to: billTo,
        deliver_to: deliverTo,
        special_instructions: specialInstructions,
        items,
        pdf_url: pdfBlob.url,
        status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ success: false, message: "Failed to save order" }, { status: 500 })
    }

    console.log("Submission created successfully:", submission.id)

    // Revalidate admin page
    revalidatePath("/admin")
    console.log("Revalidated /admin path.")

    console.log("Generating email...")

    // Send email
    const emailResult = await sendOrderEmail({
      to: brandEmail,
      cc: email,
      subject: `New Order from ${brandName}`,
      brandName,
      orderedBy,
      email,
      phone,
      billTo,
      deliverTo,
      specialInstructions,
      items,
      pdfUrl: pdfBlob.url,
    })

    console.log("Email result:", emailResult)

    return NextResponse.json({
      success: true,
      message: "Order submitted successfully!",
      submissionId: submission.id,
    })
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

function generatePDFContent(data: any): string {
  // Simple PDF-like content (in a real app, use a proper PDF library)
  return `
Order Details
=============

Brand: ${data.brandName}
Ordered By: ${data.orderedBy}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Bill To: ${data.billTo}
Deliver To: ${data.deliverTo}

Items:
${Object.entries(data.items)
  .map(
    ([id, item]: [string, any]) =>
      `- ${item.name}: ${item.quantity}${item.customQuantity ? ` (${item.customQuantity})` : ""}`,
  )
  .join("\n")}

Special Instructions:
${data.specialInstructions || "None"}

Generated on: ${new Date().toLocaleString()}
  `
}
