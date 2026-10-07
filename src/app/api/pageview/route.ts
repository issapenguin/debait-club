import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

// POST /api/pageview { path, referrer? } — logs one page view via the
// log_page_view RPC (SECURITY DEFINER, same pattern as record_dwell).
// A direct table insert with Prefer: return=representation was rejected
// (42501) because page_views has no anon SELECT policy and PostgREST
// applies SELECT policies to RETURNING rows — that silently killed
// tracking on 2026-09-29. The RPC inserts and returns the new id
// without needing table SELECT rights. Path/referrer are validated here
// and again by check constraints in the migration. The user agent is
// taken from the request header (not the body) and stored for bot
// identification; it is not exposed through the public read view.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    path?: unknown;
    referrer?: unknown;
  };
  const { path, referrer } = body;

  if (
    typeof path !== 'string' ||
    path.length === 0 ||
    path.length > 500 ||
    !path.startsWith('/')
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ref =
    typeof referrer === 'string' && referrer.length > 0
      ? referrer.slice(0, 1000)
      : null;
  const ua = request.headers.get('user-agent')?.slice(0, 2000) ?? null;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Analytics is optional: no-op when Supabase isn't configured.
    return NextResponse.json({ ok: true });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/log_page_view`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_path: path,
      p_referrer: ref,
      p_user_agent: ua,
    }),
  });

  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
  const newId = (await res.json().catch(() => null)) as unknown;
  const id = typeof newId === 'number' ? newId : null;
  return NextResponse.json({ ok: true, id });
}
