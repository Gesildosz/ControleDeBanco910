import { createClient } from "@supabase/supabase-js"

// Client-side Supabase client (singleton pattern)
let clientSideSupabase: ReturnType<typeof createClient> | null = null

export function createClientSideSupabase() {
  if (!clientSideSupabase) {
    clientSideSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return clientSideSupabase
}
