import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

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
    console.error("Error fetching user profile or profile not found", error)
    return redirect("/login")
  }

  if (profile.role !== "admin") {
    return redirect("/")
  }

  return { user, profile }
}
