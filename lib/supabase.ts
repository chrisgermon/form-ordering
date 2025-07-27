import { createClient as _createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// This function creates the public client.
// It's safe to call anywhere.
const createPublicClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Public Supabase environment variables are not configured.")
  }

  return _createClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance of the public client.
// This is for use in client components.
export const supabase = createPublicClient()

// This function creates the admin client.
// It should only be called on the server.
const _createServerSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Server-side Supabase environment variables are not configured.")
  }

  return _createClient(supabaseUrl, supabaseServiceKey)
}

// Export under both names to avoid deployment errors from inconsistent imports.
export const createServerSupabaseClient = _createServerSupabaseClient
export const createAdminSupabaseClient = _createServerSupabaseClient
