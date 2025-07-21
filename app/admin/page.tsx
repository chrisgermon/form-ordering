import { AdminDashboard } from "./AdminDashboard"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <AdminDashboard />
    </div>
  )
}
