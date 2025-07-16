import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
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
    const { data: brands, error } = await supabase.from("brands").select("*, clinic_locations(*)").order("name")
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

    const { clinicLocations, ...brandDetails } = body
    const slug = slugify(brandDetails.name)

    const { data: newBrand, error: brandError } = await supabase
      .from("brands")
      .insert({ ...brandDetails, slug })
      .select("id")
      .single()

    if (brandError) {
      if (brandError.code === "23505") {
        return NextResponse.json({ error: "A brand with this name already exists." }, { status: 409 })
      }
      throw brandError
    }

    if (clinicLocations && clinicLocations.length > 0) {
      const locationRecords = clinicLocations.map((loc: any) => ({ ...loc, brand_id: newBrand.id }))
      const { error: locError } = await supabase.from("clinic_locations").insert(locationRecords)
      if (locError) {
        await supabase.from("brands").delete().eq("id", newBrand.id)
        throw new Error(`Failed to create clinic locations: ${locError.message}`)
      }
    }

    const { data: finalBrand } = await supabase
      .from("brands")
      .select("*, clinic_locations(*)")
      .eq("id", newBrand.id)
      .single()

    revalidatePath("/admin")
    return NextResponse.json(finalBrand)
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

    const { clinicLocations, ...brandDetails } = body
    const slug = slugify(brandDetails.name)

    const { data: updatedBrand, error: brandError } = await supabase
      .from("brands")
      .update({ ...brandDetails, slug })
      .eq("id", body.id)
      .select("id, slug")
      .single()

    if (brandError) {
      if (brandError.code === "23505") {
        return NextResponse.json({ error: "A brand with this name already exists." }, { status: 409 })
      }
      throw brandError
    }

    if (clinicLocations) {
      const { data: existingLocations } = await supabase.from("clinic_locations").select("id").eq("brand_id", body.id)
      const existingIds = existingLocations?.map((l) => l.id) || []
      const newIds = clinicLocations.map((l: any) => l.id).filter(Boolean)

      const toDelete = existingIds.filter((id) => !newIds.includes(id))
      if (toDelete.length > 0) {
        await supabase.from("clinic_locations").delete().in("id", toDelete)
      }

      const toUpdate = clinicLocations.filter((l: any) => l.id && existingIds.includes(l.id))
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((l: any) =>
            supabase
              .from("clinic_locations")
              .update({ name: l.name, address: l.address, phone: l.phone, email: l.email })
              .eq("id", l.id),
          ),
        )
      }

      const toInsert = clinicLocations.filter((l: any) => !l.id)
      if (toInsert.length > 0) {
        await supabase.from("clinic_locations").insert(toInsert.map((l: any) => ({ ...l, brand_id: body.id })))
      }
    }

    const { data: finalBrand } = await supabase
      .from("brands")
      .select("*, clinic_locations(*)")
      .eq("id", body.id)
      .single()

    revalidatePath("/admin")
    revalidatePath(`/forms/${finalBrand.slug}`)
    return NextResponse.json(finalBrand)
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

    revalidatePath("/admin")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting brand:", error)
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 })
  }
}
