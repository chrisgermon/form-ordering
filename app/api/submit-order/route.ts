import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { put } from "@vercel/blob"
import { jsPDF } from "jspdf"
import { sendNewOrderEmail } from "@/lib/email" // Import the new centralized function

function generatePDF(formData: any, brandName: string, orderNumber: string) {
  const doc = new jsPDF()

  doc.setFont("helvetica")
  doc.setFontSize(24)
  doc.setTextColor(42, 55, 96)
  doc.text(brandName, 105, 30, { align: "center" })
  doc.setFontSize(20)
  doc.text("Printing Order Form", 105, 45, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(`Order #: ${orderNumber}`, 105, 55, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  let yPos = 75
  doc.rect(15, yPos - 5, 180, 30)
  doc.text(`Ordered By: ${formData.orderedBy}`, 20, yPos)
  doc.text(`Email: ${formData.email}`, 20, yPos + 7)
  doc.text(`Bill to Clinic: ${formData.billTo}`, 20, yPos + 14)
  doc.text(`Deliver to Clinic: ${formData.deliverTo}`, 20, yPos + 21)

  // FIX: Check if formData.date is valid before creating a new Date
  const orderDate = formData.date ? new Date(formData.date) : null
  doc.text(`Date: ${orderDate ? orderDate.toLocaleDateString("en-AU") : "Not specified"}`, 120, yPos + 21)

  yPos += 40
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Please check stock levels for all, then complete and send to: ${formData.brandEmail}`, 105, yPos, {
    align: "center",
  })

  yPos += 15

  const selectedItems = Object.values(formData.items || {}) as any[]

  if (selectedItems.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(42, 55, 96)
    doc.text("Selected Items:", 20, yPos)
    yPos += 10

    selectedItems.forEach((item) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      const quantity = item.quantity === "other" ? `${item.customQuantity} (custom)` : item.quantity
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`- ${item.name} (Code: ${item.code}): ${quantity}`, 30, yPos)
      yPos += 7
    })
  }

  return doc.output("arraybuffer")
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "Unknown"
    const formData = await request.json()
    const { brandId, brandName, brandEmail } = formData

    if (!brandId || !brandName || !brandEmail) {
      return NextResponse.json({ success: false, message: "Brand information is missing." }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Fetch full brand data for email template
    const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).single()
    if (brandError || !brand) {
      throw new Error("Could not retrieve brand details for email.")
    }

    const { data: submission, error: rpcError } = await supabase
      .rpc("create_new_order", {
        p_brand_id: brandId,
        p_ordered_by: formData.orderedBy,
        p_email: formData.email,
        p_bill_to: formData.billTo,
        p_deliver_to: formData.deliverTo,
        p_order_date: formData.date || null,
        p_items: formData.items || {},
        p_pdf_url: "", // Will be updated later
        p_ip_address: ip,
        p_status: "pending",
      })
      .single()

    if (rpcError) {
      console.error("RPC error:", rpcError)
      if (rpcError.message.includes("does not have initials set")) {
        throw new Error("Cannot generate order number: Brand initials are not set in the admin dashboard.")
      }
      throw new Error("Failed to save submission to database via RPC.")
    }

    if (!submission || !submission.order_number) {
      throw new Error("Failed to create submission or retrieve order number.")
    }

    const orderNumber = submission.order_number

    const pdfBuffer = generatePDF(formData, brandName, orderNumber)

    const filename = `${orderNumber}.pdf`
    const blob = await put(filename, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
    })

    const { error: updateError } = await supabase
      .from("submissions")
      .update({ pdf_url: blob.url })
      .eq("id", submission.id)

    if (updateError) {
      console.error("Error updating submission with PDF URL:", updateError)
      // Not a fatal error, we can still send the email
    }

    // Use the new centralized email function
    const emailResult = await sendNewOrderEmail({
      submission,
      brand,
      pdfBuffer: Buffer.from(pdfBuffer),
    })

    const finalStatus = emailResult.success ? "sent" : "failed"
    await supabase.from("submissions").update({ status: finalStatus }).eq("id", submission.id)

    return NextResponse.json({
      success: true,
      message: emailResult.success
        ? "Order submitted and email sent successfully!"
        : `Order submitted but email failed: ${emailResult.error}`,
      submissionId: submission.id,
      pdfUrl: blob.url,
    })
  } catch (error) {
    console.error("Error processing order:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json(
      {
        success: false,
        message: `Failed to process order: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
