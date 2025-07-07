import { createServerClient as _createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

// This is the core function that creates the Supabase client.
function createSupabaseServerClient() {
  const cookieStore = cookies()

  return _createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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

// Exporting the function under all possible names used in the project
// to resolve the deployment errors.
export const createClient = createSupabaseServerClient
export const createServerClient = createSupabaseServerClient
export const createServerSupabaseClient = createSupabaseServerClient
