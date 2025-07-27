import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types"

/**
 * Creates a Supabase client for use in Server Components, Pages, and Route Handlers.
 * This function abstracts away the need to pass cookies to the client every time.
 */
export const createServerSupabaseClient = () => createServerComponentClient<Database>({ cookies })
