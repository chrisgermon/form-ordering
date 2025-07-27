import { createClient } from "./supabase/server"

/**
 * This file acts as a compatibility layer to resolve deployment errors
 * caused by incorrect import paths referencing a legacy file structure.
 *
 * It re-exports the server client from its new location (`lib/supabase/server.ts`)
 * under the old name (`createServerSupabaseClient`) that is still being
 * referenced in other parts of the application. This ensures that legacy
 * imports do not break the build.
 */
export const createServerSupabaseClient = createClient
