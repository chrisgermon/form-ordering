import { redirect } from "next/navigation"

export default function HomePage() {
  // The root page just redirects to the admin dashboard.
  redirect("/admin")
}
