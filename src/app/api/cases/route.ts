import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';
import { moderate } from '@/lib/moderation';
import { MAX_BODY_LENGTH } from '@/lib/types';

export const dynamic = 'force-dynamic';

// POST /api/cases { topic_id, side, body } — post a new case.
export async function POST(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const { topic_id, side, body } = await request.json().catch(() => ({}));

  const topicId = Number(topic_id);
  if (!Number.isFinite(topicId)) return badRequest('A valid topic is required.');
  if (side !== 'for' && side !== 'against') return badRequest('Side must be "for" or "against".');
  if (typeof body !== 'string' || body.trim().length === 0 || body.length > MAX_BODY_LENGTH) {
    return badRequest(`Case must be 1–${MAX_BODY_LENGTH.toLocaleString()} characters.`);
  }

  const check = moderate(body);
  if (!check.ok) return badRequest(check.reason ?? 'This content is not allowed.');

  const { data: topic } = await service.from('topics').select('id').eq('id', topicId).maybeSingle();
  if (!topic) return badRequest('That topic does not exist.');

  const { data, error } = await service
    .from('cases')
    .insert({ topic_id: topicId, side, author_id: userId, body })
    .select('id')
    .single();
  if (error || !data) {
    console.error('cases insert failed', error);
    return NextResponse.json({ error: 'Could not post your case.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
