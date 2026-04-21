import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Fallback placeholder values allow the module to load at build time without
// env vars configured. All actual Supabase requests will fail gracefully.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export const createClient = () => supabase

/**
 * Create an authenticated admin client using a service-role key.
 * Only use server-side (API routes, server actions).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey)
}