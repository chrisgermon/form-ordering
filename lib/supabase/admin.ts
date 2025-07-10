import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a new Supabase admin client.
 * This client uses the service role key and should only be used in server-side environments
 * where elevated privileges are required.
 *
 * @returns {SupabaseClient} A Supabase client instance with admin privileges.
 * @throws {Error} If Supabase URL or service key is missing from environment variables.
 */
export const createAdminClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or service key is missing from environment variables.")
  }

  // Create and return a new client instance.
  // This avoids potential issues with module-level singletons in some serverless environments.
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
