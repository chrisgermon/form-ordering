import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

let supabase: SupabaseClient | undefined

function getSupabaseClient() {
  if (supabase) {
    return supabase
  }

  supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return supabase
}

// This is the new standard way to get a client instance
export const supabaseClient = getSupabaseClient()

// This function is for server components/actions that need an authenticated client
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// This is kept for backwards compatibility to prevent deployment errors
export const createClient = createServerSupabaseClient
