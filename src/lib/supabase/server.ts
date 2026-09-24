// Server-side Supabase helpers. Lazy factories — never throw when env is missing;
// they return null and pages render an "unconfigured" empty state instead.
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  isSupabaseConfigured,
  isServiceConfigured,
} from './config';

export async function getServerClient() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where setting cookies is not allowed.
        }
      },
    },
  });
}

/** Service-role client for privileged server writes (score updates, seed-time work). */
export function getServiceClient() {
  if (!isServiceConfigured()) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export async function getSessionUser() {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
