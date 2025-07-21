import { createClient } from "@/utils/supabase/server"
import AdminDashboard from "./AdminDashboard"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/login")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(`*, brands(name)`)
    .order("submitted_at", { ascending: false })

  const { data: brands } = await supabase.from("brands").select("*")

  return <AdminDashboard orders={orders ?? []} brands={brands ?? []} user={data.user} />
}
