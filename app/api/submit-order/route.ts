import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import type { OrderPayload, Brand, ClinicLocation } from "@/lib/types"
import { generatePdfAndSendEmail } from "@/lib/email"

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
  let payload: OrderPayload

  try {
    payload = await request.json()
  } catch (error) {
    console.error("Error parsing request JSON:", error)
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
  }

  const { brandSlug, orderInfo } = payload

  if (!brandSlug) {
    return NextResponse.json({ error: "Brand slug is required" }, { status: 400 })
  }

  try {
    console.log(`Processing submission for brand: ${brandSlug}`)
    const brand = await getBrandBySlug(supabase, brandSlug)
    if (!brand) {
      return NextResponse.json({ error: `Brand not found: ${brandSlug}` }, { status: 404 })
    }

    const [billTo, deliverTo] = await Promise.all([
      getClinicLocationById(supabase, orderInfo.billTo as string),
      getClinicLocationById(supabase, orderInfo.deliverTo as string),
    ])
    payload.orderInfo.billTo = billTo
    payload.orderInfo.deliverTo = deliverTo

    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .insert([
        {
          brand_id: brand.id,
          order_details: payload.orderInfo,
          items: payload.items,
          status: "submitted",
        },
      ])
      .select()
      .single()

    if (submissionError) {
      console.error("Error saving submission to database:", submissionError)
      throw new Error(`Database error: ${submissionError.message}`)
    }
    console.log("Submission saved with ID:", submissionData.id)

    const emailResult = await generatePdfAndSendEmail(payload, brand)

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
    console.error("Failed to process order submission:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json({ error: `Failed to process order: ${message}` }, { status: 500 })
  }
}
