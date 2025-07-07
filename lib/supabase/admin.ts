import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types"

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a server-side context
// RLS is bypassed, so be careful to write queries that properly scope data and permissions.
export const createAdminClient = () => {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
