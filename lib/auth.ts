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
  return user
}
