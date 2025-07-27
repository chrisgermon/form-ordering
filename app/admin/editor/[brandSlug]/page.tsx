import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"
import type { Brand } from "@/lib/types"

type Props = {
  params: {
    brandSlug: string
  }
}

export default async function FormEditorPage({ params }: Props) {
  const supabase = createClient()
  const { data: brand, error } = await supabase.from("brands").select("*").eq("slug", params.brandSlug).single()

  if (error || !brand) {
    notFound()
  }

  return <FormEditor brand={brand as Brand} />
}
