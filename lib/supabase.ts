import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Server-side Supabase client
export function createServerClient() {
  const cookieStore = cookies() // Required for Next.js Server Components/Actions
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for full access on server
    {
      auth: {
        persistSession: false, // Do not persist session on server
      },
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      },
    },
  )
}

// Client-side Supabase client (singleton pattern)
let clientSideSupabase: ReturnType<typeof createClient> | null = null

export function createClientSideSupabase() {
  if (!clientSideSupabase) {
    clientSideSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return clientSideSupabase
}
