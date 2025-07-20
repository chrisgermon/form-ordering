import { createClient } from "@/utils/supabase/server"
import { AdminDashboard } from "./AdminDashboard"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage() {
  return <AdminDashboard />
}
