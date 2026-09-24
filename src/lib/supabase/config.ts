// Central env access. The build must pass with no Supabase env set, so nothing
// here throws — callers check isSupabaseConfigured() and degrade gracefully.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

export function isServiceConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_SERVICE_ROLE_KEY.length > 0;
}
