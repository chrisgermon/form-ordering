// This file is a compatibility layer to prevent breaking changes from the refactor.
// New code should import directly from 'lib/supabase/server' or 'lib/supabase/client'.
import { createClient as createServerSupabaseClient } from "./supabase/server"
import { supabase as supabaseClient } from "./supabase/client"

export { createServerSupabaseClient, supabaseClient }
