import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function checkUserPermissions(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user has admin role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  return user
}
