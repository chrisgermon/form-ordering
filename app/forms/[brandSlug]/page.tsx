import { createClient } from "@/utils/supabase/server"
import { ClientForm } from "./client-form"
import type { SafeFormProps } from "@/lib/types"
import ErrorDisplay from "./error-display"

async function getFormData(slug: string) {
  const supabase = createClient();

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo")
    .eq("slug", slug)
    .single();

  if (brandError || !brand) {
    console.error(`[SERVER] getFormData: Brand not found for slug: ${slug}`, brandError);
    return { error: "Brand not found" };
  }

  const [locationsRes, sectionsRes] = await Promise.all([
    supabase.from("clinic_locations").select("id, name, address").eq("brand_id", brand.id),
    supabase
      .from("product_sections")
      .select("id, title, items:product_items(id, name, code)") // Removed field_type
      .eq("brand_id", brand.id)
      .order("display_order", { ascending: true })
      .order("display_order", { foreignTable: "product_items", ascending: true }),
  ]);

  if (locationsRes.error || sectionsRes.error) {
    console.error(`[SERVER] getFormData: Data fetching error for slug: ${slug}`, {
      locationsError: locationsRes.error,
      sectionsError: sectionsRes.error,
    });
    return { error: "Could not load form data." };
  }

  const props: SafeFormProps = {
    brand: {
      id: String(brand.id),
      name: String(brand.name),
      slug: String(brand.slug),
      logo: brand.logo ? String(brand.logo) : null,
    },
    locations: (locationsRes.data || []).map((loc) => ({
      value: String(loc.id),
      label: `${String(loc.name)} - ${String(loc.address || "")}`,
    })),
    sections: (sectionsRes.data || []).map((sec) => ({
      id: String(sec.id),
      title: String(sec.title),
      items: (sec.items || []).map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        code: item.code ? String(item.code) : null,
        fieldType: "number", // Set default value here
      })),
    })),
  };

  return { data: props };
}

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const { data, error } = await getFormData(params.brandSlug);

  if (error || !data) {
    return <ErrorDisplay message={error || "An unknown error occurred."} />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        <ClientForm {...data} />
      </div>
    </div>
  );
}
