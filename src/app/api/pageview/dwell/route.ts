import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

// POST /api/pageview/dwell { id, dwellMs } — records time spent on a page
// view. Writes go through the record_dwell RPC (first write wins); the anon
// key has no UPDATE rights on page_views.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    id?: unknown;
    dwellMs?: unknown;
  };
  const { id, dwellMs } = body;

  if (
    typeof id !== 'number' ||
    !Number.isInteger(id) ||
    id <= 0 ||
    typeof dwellMs !== 'number' ||
    !Number.isFinite(dwellMs) ||
    dwellMs < 0 ||
    dwellMs > 43200000
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ ok: true });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_dwell`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_id: id, p_ms: Math.round(dwellMs) }),
  });

  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
  return NextResponse.json({ ok: true });
}
