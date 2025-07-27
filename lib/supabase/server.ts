import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types"

/**
 * Creates a Supabase client for use in Server Components, Pages, and Route Handlers.
 * This function abstracts away the need to pass cookies to the client every time.
 */
export const createServerSupabaseClient = () => createServerComponentClient<Database>({ cookies })

/**
 * Creates a Supabase client with admin privileges for use in server-side operations.
 * This client uses the service role key and bypasses RLS.
 */
export const createAdminSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
