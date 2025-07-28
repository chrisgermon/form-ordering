"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign in error:", error.message)
    return redirect(`/login?message=Could not authenticate user: ${error.message}`)
  }

  revalidatePath("/admin", "layout")
  return redirect("/admin")
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign out error:", error.message)
    return redirect("/login?message=Could not sign out user.")
  }

  return redirect("/login")
}
