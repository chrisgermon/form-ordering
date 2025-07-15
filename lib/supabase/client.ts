import { createClient } from "@supabase/supabase-js"

// Public client for use in client-side components (e.g., browser)
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
