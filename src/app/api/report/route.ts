import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';

export const dynamic = 'force-dynamic';

// POST /api/report { target_type: 'case'|'comment', target_id, reason? }
export async function POST(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const { target_type, target_id, reason } = await request.json().catch(() => ({}));
  if (target_type !== 'case' && target_type !== 'comment') {
    return badRequest('target_type must be "case" or "comment".');
  }
  const targetId = Number(target_id);
  if (!Number.isFinite(targetId)) return badRequest('A valid target is required.');

  const { error } = await service.from('reports').insert({
    reporter_id: userId,
    target_type,
    target_id: targetId,
    reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
  });
  if (error) {
    return NextResponse.json({ error: 'Could not file your report.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
