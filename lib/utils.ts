import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const slugify = (text: string) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

export async function checkUserPermissions(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This will redirect to a login page if one is set up.
    // For now, it might be better to redirect to the home page.
    return redirect("/")
  }

  // Ensure ADMIN_EMAIL_RECIPIENT is set in your environment variables
  const adminEmails = (process.env.ADMIN_EMAIL_RECIPIENT || "").split(",").filter(Boolean)
  if (!user.email || adminEmails.length === 0 || !adminEmails.includes(user.email)) {
    // Redirect non-admins to the home page
    return redirect("/")
  }
}
