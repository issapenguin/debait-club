import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

// POST /api/pageview { path, referrer? } — logs one page view. The
// page_views table's RLS allows anon inserts; path/referrer are validated
// here and again by check constraints in the migration.
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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Analytics is optional: no-op when Supabase isn't configured.
    return NextResponse.json({ ok: true });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ path, referrer: ref }),
  });

  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
  const rows = (await res.json().catch(() => [])) as { id?: unknown }[];
  const id = typeof rows?.[0]?.id === 'number' ? rows[0].id : null;
  return NextResponse.json({ ok: true, id });
}
