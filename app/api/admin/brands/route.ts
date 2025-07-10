import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"

const slugify = (text: string) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: brands, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo, emails, clinic_locations, active")
      .order("name")

    if (error) throw error

    return NextResponse.json(brands)
  } catch (error) {
    console.error("Error fetching brands:", error)
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

    const slug = slugify(body.name)

    const { data: brand, error } = await supabase
      .from("brands")
      .insert({
        name: body.name,
        slug: slug,
        logo: body.logo,
        emails: body.emails || [],
        clinic_locations: body.clinicLocations || [],
        active: body.active,
      })
      .select("id, name, slug, logo, emails, clinic_locations, active")
      .single()

    if (error) {
      console.error("Error creating brand:", error)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A brand with this name already exists. Please choose a different name." },
          { status: 409 },
        )
      }
      throw error
    }

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

    const slug = slugify(body.name)

    const { data: brand, error } = await supabase
      .from("brands")
      .update({
        name: body.name,
        slug: slug,
        logo: body.logo,
        emails: body.emails || [],
        clinic_locations: body.clinicLocations || [],
        active: body.active,
      })
      .eq("id", body.id)
      .select("id, name, slug, logo, emails, clinic_locations, active")
      .single()

    if (error) {
      console.error("Error updating brand:", error)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A brand with this name already exists. Please choose a different name." },
          { status: 409 },
        )
      }
      throw error
    }

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting brand:", error)
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 })
  }
}
