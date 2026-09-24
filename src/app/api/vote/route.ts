import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';

export const dynamic = 'force-dynamic';

// POST /api/vote { target_type: 'case'|'comment', target_id } — toggles an upvote.
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

  const table = target_type === 'case' ? 'cases' : 'comments';
  const { data: target } = await service.from(table).select('id').eq('id', targetId).maybeSingle();
  if (!target) return badRequest('That item does not exist.');

  const { data: existing } = await service
    .from('votes')
    .select('id')
    .eq('voter_id', userId)
    .eq('target_type', target_type)
    .eq('target_id', targetId)
    .maybeSingle();

  let voted: boolean;
  if (existing) {
    await service.from('votes').delete().eq('id', existing.id);
    voted = false;
  } else {
    await service.from('votes').insert({ voter_id: userId, target_type, target_id: targetId });
    voted = true;
  }

  // Recompute the denormalized score from the vote count.
  const { count } = await service
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', target_type)
    .eq('target_id', targetId);
  const score = count ?? 0;
  await service.from(table).update({ score }).eq('id', targetId);

  return NextResponse.json({ ok: true, voted, score });
}
