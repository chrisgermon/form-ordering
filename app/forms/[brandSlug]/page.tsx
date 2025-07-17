"use client"

import { notFound } from "next/navigation";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { ClientForm } from "./client-form";
import type {
  Brand,
  LocationOption,
  Section,
  Item,
  ClientFormParams,
  Option,
} from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 0;

type BrandFetchResult = {
  status: "found" | "inactive" | "not_found";
  data: ClientFormParams | { name: string } | null;
};

// Fetches brand data and related objects
async function getSanitizedBrandData(
  slug: string,
): Promise<BrandFetchResult> {
  const supabase = createClient();

  // Fetch the core brand data
  const { data: brand, error: brandError } = await supabase
    .from<Brand>("brands")
    .select("id, name, slug, logo, active")
    .eq("slug", slug)
    .single();

  if (brandError || !brand) {
    console.error(`Data fetching error for slug "${slug}":`, brandError?.message);
    return { status: "not_found", data: null };
  }

  if (!brand.active) {
    return { status: "inactive", data: { name: brand.name } };
  }

  // Fetch related data in parallel
  const [locationsResult, sectionsResult] = await Promise.all([
    supabase
      .from("clinic_locations")
      .select("id, name")
      .eq("brand_id", brand.id),
    supabase
      .from("sections")
      .select("id, title, position")
      .eq("brand_id", brand.id)
      .order("position"),
  ]);

  if (sectionsResult.error) {
    console.error(
      `Error fetching sections for brand ${slug}:`,
      sectionsResult.error.message,
    );
    return { status: "not_found", data: null };
  }

  const clinicLocations = locationsResult.data || [];
  const sectionsData = sectionsResult.data || [];

  // Fetch items for each section
  const sanitizedSections: Section[] = await Promise.all(
    sectionsData.map(async (section) => {
      const { data: itemsData, error: itemsError } = await supabase
        .from<Item>("items")
        .select("*")
        .eq("section_id", section.id)
        .order("position");

      if (itemsError) {
        console.error(
          `Error fetching items for section ${section.id}:`,
          itemsError.message,
        );
        return null;
      }

      const itemsWithSafeOptions: Item[] = await Promise.all(
        (itemsData || []).map(async (item) => {
          const { data: optionsData, error: optionsError } = await supabase
            .from<Option>("options")
            .select("id, value, label, sort_order")
            .eq("item_id", item.id)
            .order("sort_order");

          if (optionsError) {
            console.error(
              `Error fetching options for item ${item.id}:`,
              optionsError.message,
            );
          }

          const safeOptions = (optionsData || []).map((opt) => ({
            ...opt,
            label: opt.label || opt.value,
          }));

          return { ...item, options: safeOptions } as Item;
        }),
      );

      return { ...section, items: itemsWithSafeOptions };
    }),
  ).then((results) =>
    results.filter((s): s is Section => s !== null && s.items.length > 0),
  );

  // **NEW:** Avoid rendering the form if no sections exist
  if (sanitizedSections.length === 0) {
    console.warn(`No sections available for brand "${slug}".`);
    return { status: "not_found", data: null };
  }

  const locationOptions: LocationOption[] = clinicLocations.map((loc) => ({
    value: String(loc.id),
    label: String(loc.name),
  }));

  const clientProps: ClientFormParams = {
    brandName: brand.name,
    brandSlug: brand.slug,
    brandLogo: brand.logo,
    locationOptions,
    sections: sanitizedSections,
  };

  return { status: "found", data: clientProps };
}

export default async function BrandFormPage({
  params,
}: {
  params: { brandSlug: string };
}) {
  const { status, data } = await getSanitizedBrandData(params.brandSlug);

  if (status === "not_found") {
    notFound();
  }

  if (status === "inactive") {
    const { name } = data as { name: string };
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Form Currently Unavailable</AlertTitle>
          <AlertDescription>
            The order form for "{name}" is not currently active. Please contact
            the administrator for assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const clientProps = data as ClientFormParams;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 w-[160px]">
            <Image
              src={clientProps.brandLogo || "/placeholder.svg"}
              alt={`${clientProps.brandName} Logo`}
              width={160}
              height={40}
              className="object-contain h-10 w-auto"
              priority
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center flex-1">
            {clientProps.brandName} Order Form
          </h1>
          <div className="w-[160px]" /> {/* Spacer */}
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <ClientForm {...clientProps} />
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} {clientProps.brandName}. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
