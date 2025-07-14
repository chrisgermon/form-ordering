import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Public client for use in client-side components (e.g., browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for use in server-side logic (Server Components, API routes, Server Actions)
// This uses the service role key for elevated privileges.
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or service key is missing from environment variables.")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export type Submission = {
  id: string
  brand_id: string
  ordered_by: string
  email: string
  bill_to: string
  deliver_to: string
  order_date: string | null
  items: Record<string, any>
  pdf_url: string | null
  status: "pending" | "sent" | "failed"
  created_at: string
  updated_at: string
}
