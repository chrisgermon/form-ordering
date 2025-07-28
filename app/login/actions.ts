"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign in error:", error.message)
    return { error: `Sign in error: ${error.message}` }
  }

  return redirect("/admin")
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  return redirect("/login")
}
