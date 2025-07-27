import { createClient } from "./supabase/server"

// This file is created to maintain compatibility with older code
// that imports `createServerSupabaseClient` from `@/lib/supabase`.
// It simply re-exports the new server client function (`createClient`)
// under the old, expected name.
export const createServerSupabaseClient = createClient
