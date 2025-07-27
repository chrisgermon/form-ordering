import AdminActions from "./AdminActions"
import { Toaster } from "@/components/ui/toaster"

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Page</h1>
      <AdminActions />
      <Toaster />
    </div>
  )
}
