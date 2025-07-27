import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function checkUserPermissions() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (error || !profile) {
    console.error("Error fetching profile or profile not found:", error)
    return redirect("/login")
  }

  if (profile.role !== "admin") {
    return redirect("/")
  }

  return { user, profile }
}
