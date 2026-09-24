'use client';

// Lazy browser client: created on first use, never at module import time.
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config';

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | null = null;

export function getBrowserClient(): BrowserClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}
