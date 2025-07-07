import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { cookies } from "next/headers"
import { createAdminClient as adminClient } from "./admin"

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Also export under the old name to fix dependencies in other files.
export const createServerSupabaseClient = createClient
// FIX: Add the missing export that the build process is looking for.
export const createSupabaseServerClient = createClient

// Re-export the admin client to fix the persistent deployment error.
// This makes the import valid for the file that is incorrectly referencing it.
export const createAdminClient = adminClient
