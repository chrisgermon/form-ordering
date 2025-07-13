import { createBrowserClient } from "@supabase/ssr"

// Create a singleton Supabase client for browser-side usage.
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default supabase
