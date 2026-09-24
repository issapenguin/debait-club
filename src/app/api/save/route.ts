import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';

export const dynamic = 'force-dynamic';

// POST /api/save { target_type: 'case'|'comment', target_id } — toggles a bookmark.
export async function POST(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const { target_type, target_id } = await request.json().catch(() => ({}));
  if (target_type !== 'case' && target_type !== 'comment') {
    return badRequest('target_type must be "case" or "comment".');
  }
  const targetId = Number(target_id);
  if (!Number.isFinite(targetId)) return badRequest('A valid target is required.');

  const { data: existing } = await service
    .from('saved_items')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', target_type)
    .eq('target_id', targetId)
    .maybeSingle();

  let saved: boolean;
  if (existing) {
    await service.from('saved_items').delete().eq('id', existing.id);
    saved = false;
  } else {
    await service.from('saved_items').insert({ user_id: userId, target_type, target_id: targetId });
    saved = true;
  }
  return NextResponse.json({ ok: true, saved });
}
