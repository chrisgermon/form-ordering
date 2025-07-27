import { createServerSupabaseClient } from "@/lib/supabase/server"

const FormEditorPage = async ({ params }: { params: { brandSlug: string } }) => {
  const supabase = createServerSupabaseClient()
  const { data: brand, error } = await supabase.from("brands").select().eq("slug", params.brandSlug).single()

  if (error) {
    console.error(error)
    return <div>Error loading brand</div>
  }

  if (!brand) {
    return <div>Brand not found</div>
  }

  return (
    <div>
      <h1>Editor for {brand.name}</h1>
      {/* Add your form editor components here, passing the brand data as needed */}
    </div>
  )
}

export default FormEditorPage
