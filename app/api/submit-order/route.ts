import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import { jsPDF } from "jspdf"
import { sendEmail, generateOrderEmailTemplate } from "@/lib/email"
import { revalidatePath } from "next/cache"

function generatePDF(formData: any, brandName: string) {
  const doc = new jsPDF()

  doc.setFont("helvetica")
  doc.setFontSize(24)
  doc.setTextColor(42, 55, 96)
  doc.text(brandName, 105, 30, { align: "center" })
  doc.setFontSize(20)
  doc.text("Printing Order Form", 105, 45, { align: "center" })

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  let yPos = 65
  doc.rect(15, yPos - 5, 180, 25)
  doc.text(`Ordered By: ${formData.orderedBy}`, 20, yPos)
  doc.text(`Email: ${formData.email}`, 20, yPos + 5)
  doc.text(`Bill to Clinic: ${formData.billTo}`, 20, yPos + 10)
  doc.text(`Deliver to Clinic: ${formData.deliverTo}`, 20, yPos + 15)
  doc.text(
    `Date: ${formData.date ? new Date(formData.date).toLocaleDateString("en-AU") : "Not specified"}`,
    20,
    yPos + 20,
  )

  yPos += 35
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
    const { brandId, brandName, brandEmail, items } = formData

    console.log("Received form data:", { brandId, brandName, brandEmail, itemsCount: Object.keys(items || {}).length })

    if (!brandId || !brandName || !brandEmail) {
      console.error("Missing brand information:", { brandId, brandName, brandEmail })
      return NextResponse.json({ success: false, message: "Brand information is missing." }, { status: 400 })
    }

    if (!items || Object.keys(items).length === 0) {
      console.error("No items selected")
      return NextResponse.json({ success: false, message: "No items were selected." }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Generate PDF
    console.log("Generating PDF...")
    const pdfBuffer = generatePDF(formData, brandName)

    // Upload PDF to Vercel Blob
    console.log("Uploading PDF to blob storage...")
    const filename = `${brandId}-order-${Date.now()}.pdf`
    const blob = await put(filename, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
    })

    console.log("PDF uploaded successfully:", blob.url)

    // Create submission record
    console.log("Creating submission record...")
    const { data: submission, error: dbError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brandId,
        ordered_by: formData.orderedBy,
        email: formData.email,
        bill_to: formData.billTo,
        deliver_to: formData.deliverTo,
        order_date: formData.date || null,
        items: formData.items || {},
        pdf_url: blob.url,
        ip_address: ip,
        status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { success: false, message: `Failed to save submission to database: ${dbError.message}` },
        { status: 500 },
      )
    }

    console.log("Submission created successfully:", submission.id)

    // Revalidate admin path
    revalidatePath("/admin")
    console.log("Revalidated /admin path.")

    // Prepare email data
    const selectedItemsForEmail = Object.values(formData.items || {}).map((item: any) => ({
      name: item.name,
      quantity: item.quantity === "other" ? `${item.customQuantity || "N/A"} (custom)` : item.quantity,
    }))

    const submissionDataForEmail = {
      brand_name: brandName,
      clinic_name: formData.deliverTo,
      submitted_by: formData.orderedBy,
      created_at: new Date().toISOString(),
      items: selectedItemsForEmail,
    }

    // Generate and send email
    console.log("Generating email...")
    const emailHtml = generateOrderEmailTemplate(submissionDataForEmail)

    console.log("Sending email...")
    const emailResult = await sendEmail({
      to: brandEmail,
      cc: formData.email,
      subject: `New Printing Order - ${brandName} - ${formData.orderedBy}`,
      html: emailHtml,
      attachments: [
        {
          filename: `${brandName.toLowerCase().replace(/\s+/g, "-")}-order.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: "application/pdf",
        },
      ],
    })

    // Update submission status based on email result
    const finalStatus = emailResult.success ? "sent" : "failed"
    await supabase.from("submissions").update({ status: finalStatus }).eq("id", submission.id)

    console.log("Email result:", emailResult)

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
