import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';
import { moderate } from '@/lib/moderation';
import { STANCES } from '@/lib/types';

export const dynamic = 'force-dynamic';

const MAX_COMMENT_LENGTH = 2000;

// POST /api/comments { case_id, parent_id?, body, stance }
export async function POST(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const { case_id, parent_id, body, stance } = await request.json().catch(() => ({}));

  const caseId = Number(case_id);
  if (!Number.isFinite(caseId)) return badRequest('A valid case is required.');
  if (typeof body !== 'string' || body.trim().length === 0 || body.length > MAX_COMMENT_LENGTH) {
    return badRequest(`Comment must be 1–${MAX_COMMENT_LENGTH.toLocaleString()} characters.`);
  }
  if (!STANCES.includes(stance)) return badRequest('Pick a valid stance for your comment.');

  const check = moderate(body);
  if (!check.ok) return badRequest(check.reason ?? 'This content is not allowed.');

  const { data: target } = await service.from('cases').select('id').eq('id', caseId).maybeSingle();
  if (!target) return badRequest('That case does not exist.');

  let parentId: number | null = null;
  if (parent_id !== undefined && parent_id !== null) {
    parentId = Number(parent_id);
    if (!Number.isFinite(parentId)) return badRequest('Invalid reply target.');
    const { data: parent } = await service
      .from('comments')
      .select('id, case_id')
      .eq('id', parentId)
      .maybeSingle();
    if (!parent || parent.case_id !== caseId) {
      return badRequest('You can only reply to comments on the same case.');
    }
  }

  const { data, error } = await service
    .from('comments')
    .insert({ case_id: caseId, parent_id: parentId, author_id: userId, body, stance })
    .select('id')
    .single();
  if (error || !data) {
    console.error('comments insert failed', error);
    return NextResponse.json({ error: 'Could not post your comment.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}

// DELETE /api/comments?id=123 — the author deletes their own comment.
export async function DELETE(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isFinite(id)) return badRequest('A valid comment is required.');

  const { data: comment } = await service
    .from('comments')
    .select('id, author_id')
    .eq('id', id)
    .maybeSingle();
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
  }
  if (comment.author_id !== userId) {
    return NextResponse.json(
      { error: 'You can only delete your own comments.' },
      { status: 403 }
    );
  }

  // votes and saved_items reference targets without a foreign key, so clean
  // them explicitly; replies cascade automatically.
  await service.from('votes').delete().eq('target_type', 'comment').eq('target_id', id);
  await service
    .from('saved_items')
    .delete()
    .eq('target_type', 'comment')
    .eq('target_id', id);
  const { error } = await service.from('comments').delete().eq('id', id);
  if (error) {
    console.error('comment delete failed', error);
    return NextResponse.json({ error: 'Could not delete your comment.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
