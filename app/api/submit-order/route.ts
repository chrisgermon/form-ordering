import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { apiOrderSchema } from "@/lib/schemas"
import { sendOrderEmail } from "@/lib/email"
import { generatePdf } from "@/lib/pdf"
import { getBrandBySlug } from "@/lib/db"
import type { OrderPayload } from "@/lib/types"
import { z } from "zod"

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { brandSlug, ...orderData } = body
  if (!brandSlug) {
    return NextResponse.json({ error: "Brand slug is missing" }, { status: 400 })
  }

  try {
    const brand = await getBrandBySlug(brandSlug)
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    const validation = apiOrderSchema.safeParse(orderData)
    if (!validation.success) {
      console.error("Validation errors:", validation.error.errors)
      return NextResponse.json({ error: "Invalid data", details: validation.error.errors }, { status: 400 })
    }

    const validatedOrderData = validation.data

    // Fetch the latest order number for the brand and increment it
    const { data: lastOrder, error: lastOrderError } = await supabase
      .from("submissions")
      .select("order_number")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (lastOrderError && lastOrderError.code !== "PGRST116") {
      // PGRST116: "The result contains 0 rows" which is fine for the first order
      console.error("Error fetching last order number:", lastOrderError)
      throw new Error("Could not fetch last order number.")
    }

    let newOrderNumberInt = 1
    if (lastOrder && lastOrder.order_number) {
      const lastNumStr = lastOrder.order_number.split("-").pop()
      if (lastNumStr) {
        const parsedNum = Number.parseInt(lastNumStr, 10)
        if (!isNaN(parsedNum)) {
          newOrderNumberInt = parsedNum + 1
        }
      }
    }

    const orderPrefix = brand.order_prefix || brand.slug.toUpperCase()
    const orderNumber = `${orderPrefix}-${String(newOrderNumberInt).padStart(4, "0")}`

    // This is the object that will be stored in the `order_data` column.
    const submissionData = {
      ...validatedOrderData,
      orderNumber: orderNumber,
    }

    // Insert into database, populating all relevant columns
    const { error: dbError } = await supabase.from("submissions").insert({
      brand_id: brand.id,
      order_data: submissionData as any,
      ordered_by: validatedOrderData.orderedBy,
      email: validatedOrderData.email,
      order_number: orderNumber,
      ip_address: req.ip,
      bill_to: validatedOrderData.billTo,
      deliver_to: validatedOrderData.deliverTo,
    })

    if (dbError) {
      console.error("Error saving submission to database:", dbError)
      return NextResponse.json({ error: "Error saving submission", details: dbError }, { status: 500 })
    }

    // This payload is structured for the PDF and email functions
    const payloadForPdfAndEmail: OrderPayload = {
      brandId: brand.id,
      orderInfo: {
        orderedBy: validatedOrderData.orderedBy,
        email: validatedOrderData.email,
        billTo: validatedOrderData.billTo,
        deliverTo: validatedOrderData.deliverTo,
        notes: validatedOrderData.notes,
        orderNumber: orderNumber,
        date: validatedOrderData.date,
      },
      items: validatedOrderData.items,
    }

    // Get logo URL for PDF generation
    let logoUrl: string | null = null
    if (brand.logo) {
      const { data: fileData } = await supabase.from("uploaded_files").select("url").eq("pathname", brand.logo).single()
      if (fileData) {
        logoUrl = fileData.url
      }
    }

    const pdfBuffer = await generatePdf(payloadForPdfAndEmail, brand, logoUrl)

    // Send email
    const emailResult = await sendOrderEmail(payloadForPdfAndEmail, brand, pdfBuffer, logoUrl)

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.message)
      // Don't block the response, but log the error
    }

    return NextResponse.json({ message: "Order submitted successfully", orderNumber: orderNumber })
  } catch (error) {
    console.error("Error processing order:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to process order", details: errorMessage }, { status: 500 })
  }
}
