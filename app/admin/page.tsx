import { AdminDashboard } from "./AdminDashboard"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage() {
  // The AdminDashboard component is now fully client-side and will fetch its own data.
  return <AdminDashboard />
}
