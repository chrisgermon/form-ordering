import { AdminDashboard } from "./AdminDashboard"
import { createAdminClient } from "@/utils/supabase/server"
import type { Brand } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getBrands(): Promise<Brand[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("brands").select("*").order("name")
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data
}

export default async function AdminDashboardPage() {
  const brands = await getBrands()
  // Initial submissions are fetched on the client-side in AdminDashboard
  return <AdminDashboard initialBrands={brands} />
}
