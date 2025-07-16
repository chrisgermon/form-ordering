import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { Brand, ClinicLocation, LocationOption, Section, Item, Option } from "@/lib/types"

export const revalidate = 0

export async function GET(request: Request, { params }: { params: { brandSlug: string } }) {
  const slug = params.brandSlug
  if (!slug) {
    return NextResponse.json({ error: "Brand slug is required" }, { status: 400 })
  }

  try {
    const supabase = createClient()

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*, clinic_locations(*), sections(*, items(*, options(*)))")
      .eq("slug", slug)
      .single<
        Brand & {
          clinic_locations: ClinicLocation[]
          sections: (Section & { items: (Item & { options: Option[] })[] })[]
        }
      >()

    if (brandError || !brand) {
      console.error(`Data fetching error for slug "${slug}":`, brandError?.message)
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    if (!brand.active) {
      return NextResponse.json({ error: `Form for ${brand.name} is not active.` }, { status: 403 })
    }

    const locationOptions: LocationOption[] = (brand.clinic_locations || [])
      .filter((loc): loc is ClinicLocation => loc && typeof loc.id === "string" && typeof loc.name === "string")
      .map((loc) => ({
        value: loc.id,
        label: loc.name,
      }))

    const sanitizedSections: Section[] = (brand.sections || [])
      .map((section) => {
        const sanitizedItems = (section.items || []).map((item) => {
          const sanitizedOptions = (item.options || [])
            .filter((opt): opt is Option => opt && typeof opt.value === "string")
            .map((opt) => ({ ...opt, label: opt.label || opt.value }))
          return { ...item, options: sanitizedOptions }
        })
        return { ...section, items: sanitizedItems }
      })
      .filter((section) => section.items.length > 0)

    const sanitizedData = {
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      locationOptions,
      sections: sanitizedSections,
    }

    return NextResponse.json(sanitizedData)
  } catch (error) {
    console.error("API Error fetching form data:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 })
  }
}
