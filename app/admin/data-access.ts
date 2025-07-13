"use server"

import { createClient } from "@/utils/supabase/server"

export async function getBrands() {
  const supabase = createClient()
  const { data, error } = await supabase.from("brands").select("*").order("name")
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data || []
}

export async function getSubmissions() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("submissions")
    .select("*, brands(name, slug)")
    .order("created_at", { ascending: false })
  if (error) {
    console.error("Error fetching submissions:", error)
    return []
  }
  return data || []
}

export async function getFiles() {
  const supabase = createClient()
  const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false })
  if (error) {
    console.error("Error fetching files:", error)
    return []
  }
  return data || []
}
