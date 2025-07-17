import { notFound } from "next/navigation"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { ClientForm } from "./form"
import type { LocationOption, Section, Item, ClientFormParams, Brand } from "@/lib/types"
import { createClient } from "@/utils/supabase/server"

export const revalidate = 0

type BrandFetchResult = {
  status: "found" | "inactive" | "not_found" | "error"
  data: ClientFormParams | { name: string } | null
  message?: string
}

async function getBrandClientParams(slug: string): Promise<BrandFetchResult> {
  const supabase = createClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, active, description")
    .eq("slug", slug)
    .single<Brand>()

  if (brandError || !brand) {
    console.error(`Brand fetch error for slug "${slug}":`, brandError?.message)
    return { status: "not_found", data: null }
  }

  if (!brand.active) {
    return { status: "inactive", data: { name: brand.name } }
  }

  try {
    const [locationsResult, sectionsResult] = await Promise.all([
      supabase.from("clinic_locations").select("id, name, address").eq("brand_id", brand.id),
      supabase.from("sections").select("id, title, position").eq("brand_id", brand.id).order("position"),
    ])

    if (locationsResult.error) throw new Error(`Failed to fetch clinic locations: ${locationsResult.error.message}`)
    if (sectionsResult.error) throw new Error(`Failed to fetch sections: ${sectionsResult.error.message}`)

    const locationOptions: LocationOption[] = (locationsResult.data || []).map((loc) => ({
      value: String(loc.id),
      label: `${loc.name}${loc.address ? ` - ${loc.address}` : ""}`,
    }))

    const sections: Section[] = await Promise.all(
      (sectionsResult.data || []).map(async (section) => {
        const { data: itemsData, error: itemsError } = await supabase
          .from("items")
          .select("*")
          .eq("section_id", section.id)
          .order("position")
        if (itemsError) throw new Error(`Failed to fetch items for section ${section.id}: ${itemsError.message}`)

        const itemsWithSafeOptions: Item[] = await Promise.all(
          (itemsData || []).map(async (item) => {
            const { data: optionsData, error: optionsError } = await supabase
              .from("options")
              .select("id, value, label, sort_order")
              .eq("item_id", item.id)
              .order("sort_order")
            if (optionsError) console.warn(`Could not fetch options for item ${item.id}: ${optionsError.message}`)
            return { ...item, options: optionsData || [] } as Item
          }),
        )
        return { ...section, items: itemsWithSafeOptions }
      }),
    )

    const clientProps: ClientFormParams = {
      brandName: brand.name,
      brandSlug: brand.slug,
      brandLogo: brand.logo,
      locationOptions,
      sections: sections.filter((s) => s.items.length > 0),
    }

    return { status: "found", data: clientProps }
  } catch (error) {
    console.error("Error constructing brand client params:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return { status: "error", data: { name: brand.name }, message }
  }
}

export default async function BrandFormPage({ params }: { params: { brandSlug: string } }) {
  const { status, data, message } = await getBrandClientParams(params.brandSlug)

  if (status === "not_found") {
    notFound()
  }

  const brandName = (data as { name: string })?.name || "this form"

  if (status === "inactive" || status === "error") {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{status === "inactive" ? "Form Unavailable" : "Error Loading Form"}</AlertTitle>
          <AlertDescription>
            {message || `The order form for "${brandName}" is not currently active. Please contact an administrator.`}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const clientProps = data as ClientFormParams

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        {clientProps.brandLogo && (
          <Image
            src={clientProps.brandLogo || "/placeholder.svg"}
            alt={`${clientProps.brandName} Logo`}
            width={200}
            height={100}
            className="mb-4 h-auto w-auto max-h-24 object-contain"
            priority
          />
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{clientProps.brandName} Order Form</h1>
      </div>
      <ClientForm data={JSON.stringify(clientProps)} />
    </div>
  )
}
