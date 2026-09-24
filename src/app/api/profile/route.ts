import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';

export const dynamic = 'force-dynamic';

// PUT /api/profile { bio } — the signed-in user updates their own bio.
export async function PUT(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const { bio } = await request.json().catch(() => ({}));
  if (bio !== null && typeof bio !== 'string') return badRequest('Invalid bio.');
  const clean = typeof bio === 'string' ? bio.trim().slice(0, 300) : null;

  const { error } = await service.from('profiles').update({ bio: clean }).eq('id', userId);
  if (error) {
    return NextResponse.json({ error: 'Could not save your bio.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, bio: clean });
}
