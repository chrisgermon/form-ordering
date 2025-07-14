import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import type { Brand, ClinicLocation } from "@/lib/types"
import { generatePdfAndSendEmail } from "@/lib/email"

// Define a more specific type for the incoming client payload
interface ClientOrderPayload {
  brandSlug: string
  items: Record<string, any>
  orderInfo: {
    orderedBy: string
    email: string
    billToId: string
    deliverToId: string
    notes?: string
  }
}

async function getBrandBySlug(supabase: any, slug: string): Promise<Brand | null> {
  const { data, error } = await supabase.from("brands").select("*").eq("slug", slug).single()
  if (error) {
    console.error(`Error fetching brand by slug '${slug}':`, error)
    return null
  }
  return data
}

async function getClinicLocationById(supabase: any, id: string): Promise<ClinicLocation | null> {
  if (!id) return null
  const { data, error } = await supabase.from("clinic_locations").select("*").eq("id", id).single()
  if (error) {
    console.error(`Error fetching clinic location by id '${id}':`, error)
    return null
  }
  return data
}

export async function POST(request: Request) {
  const supabase = createClient()
  let clientPayload: ClientOrderPayload

  try {
    clientPayload = await request.json()
  } catch (error) {
    console.error("Error parsing request JSON:", error)
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
  }

  const { brandSlug, orderInfo, items } = clientPayload

  if (!brandSlug) {
    return NextResponse.json({ error: "Brand slug is required" }, { status: 400 })
  }
  if (!orderInfo || !orderInfo.billToId || !orderInfo.deliverToId) {
    return NextResponse.json({ error: "Billing and delivery locations are required" }, { status: 400 })
  }

  try {
    const brand = await getBrandBySlug(supabase, brandSlug)
    if (!brand) {
      return NextResponse.json({ error: `Brand not found: ${brandSlug}` }, { status: 404 })
    }

    const [billTo, deliverTo] = await Promise.all([
      getClinicLocationById(supabase, orderInfo.billToId),
      getClinicLocationById(supabase, orderInfo.deliverToId),
    ])

    if (!billTo || !deliverTo) {
      return NextResponse.json({ error: "Could not find specified billing or delivery location." }, { status: 404 })
    }

    // Construct the full payload for internal processing
    const fullOrderPayload = {
      brandSlug: brandSlug,
      items: items,
      orderInfo: {
        ...orderInfo,
        orderNumber: `VR-${Date.now()}`, // Generate an order number
        billTo: billTo,
        deliverTo: deliverTo,
      },
    }

    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .insert([
        {
          brand_id: brand.id,
          order_details: fullOrderPayload.orderInfo,
          items: fullOrderPayload.items,
          status: "submitted",
        },
      ])
      .select()
      .single()

    if (submissionError) {
      console.error("Error saving submission to database:", submissionError)
      throw new Error(`Database error: ${submissionError.message}`)
    }

    const emailResult = await generatePdfAndSendEmail(fullOrderPayload, brand)

    if (!emailResult.success) {
      await supabase
        .from("submissions")
        .update({ status: "failed", notes: `Email failed: ${emailResult.message}` })
        .eq("id", submissionData.id)
      throw new Error(emailResult.message)
    }

    await supabase.from("submissions").update({ status: "processed" }).eq("id", submissionData.id)

    return NextResponse.json({ success: true, message: "Order submitted successfully." })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    console.error("Failed to process order submission:", message)
    return NextResponse.json({ error: `Failed to process order: ${message}` }, { status: 500 })
  }
}
