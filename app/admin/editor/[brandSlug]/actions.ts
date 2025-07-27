import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function saveFormSections(brandSlug: string, formData: FormData) {
  "use server"

  const supabase = createServerSupabaseClient()

  const formSections = formData.get("formSections") as string

  const { error } = await supabase.from("brands").update({ form_sections: formSections }).eq("slug", brandSlug)

  if (error) {
    console.error(error)
    return redirect(`/admin/editor/${brandSlug}?message=Error saving form sections`)
  }

  revalidatePath(`/admin/editor/${brandSlug}`)
  redirect(`/admin/editor/${brandSlug}?message=Form sections saved`)
}
