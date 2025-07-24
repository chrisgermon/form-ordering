import { createClient as _createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Supabase environment variables are not fully configured.")
}

// Public, client-side safe client for use in client components
export const supabase = _createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (Server Components, API Routes, Server Actions)
export const createServerSupabaseClient = () => {
  return _createClient(supabaseUrl, supabaseServiceKey)
}
