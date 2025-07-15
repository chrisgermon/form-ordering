import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Admin client for use in server-side logic (Server Components, API routes, Server Actions)
// This uses the service role key for elevated privileges.
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or service key is missing from environment variables.")
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}
