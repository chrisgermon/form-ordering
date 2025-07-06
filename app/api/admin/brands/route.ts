export const revalidate = 0

import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

const slugify = (text: string) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: brands, error } = await supabase.from("brands").select("*").order("name")
    if (error) throw error
    return NextResponse.json(brands)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 })
    }

    const { data: brand, error } = await supabase
      .from("brands")
      .insert({
        name: body.name,
        slug: slugify(body.name),
        logo_url: body.logo_url,
        active: body.active,
        to_emails: body.to_emails,
        cc_emails: body.cc_emails,
        bcc_emails: body.bcc_emails,
        clinic_locations: body.clinicLocations || [],
      })
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A brand with this name already exists." }, { status: 409 })
      }
      throw error
    }
    revalidatePath("/admin/dashboard")
    revalidatePath("/")
    return NextResponse.json(brand)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create brand"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.id || !body.name) {
      return NextResponse.json({ error: "Brand ID and name are required" }, { status: 400 })
    }

    const { data: brand, error } = await supabase
      .from("brands")
      .update({
        name: body.name,
        slug: slugify(body.name),
        logo_url: body.logo_url,
        active: body.active,
        to_emails: body.to_emails,
        cc_emails: body.cc_emails,
        bcc_emails: body.bcc_emails,
        clinic_locations: body.clinicLocations || [],
      })
      .eq("id", body.id)
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A brand with this name already exists." }, { status: 409 })
      }
      throw error
    }
    revalidatePath("/admin/dashboard")
    revalidatePath("/")
    revalidatePath(`/forms/${brand.slug}`)
    return NextResponse.json(brand)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update brand"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("brands").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/admin/dashboard")
    revalidatePath("/")
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: `Failed to delete brand: ${error.message}` }, { status: 500 })
  }
}
