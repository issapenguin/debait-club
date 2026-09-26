import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../../_helpers';

export const dynamic = 'force-dynamic';

// POST /api/submissions/vote { submission_id } — toggles a d-coin upvote.
export async function POST(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const { submission_id } = await request.json().catch(() => ({}));
  const submissionId = Number(submission_id);
  if (!Number.isFinite(submissionId)) return badRequest('A valid submission is required.');

  const { data: target } = await service
    .from('topic_submissions')
    .select('id, author_id')
    .eq('id', submissionId)
    .maybeSingle();
  if (!target) return badRequest('That submission does not exist.');

  const { data: existing } = await service
    .from('submission_votes')
    .select('id')
    .eq('voter_id', userId)
    .eq('submission_id', submissionId)
    .maybeSingle();

  // Retracting an existing upvote is always allowed; only casting a new
  // upvote is restricted.
  if (existing) {
    await service.from('submission_votes').delete().eq('id', (existing as { id: number }).id);
    const { count } = await service
      .from('submission_votes')
      .select('id', { count: 'exact', head: true })
      .eq('submission_id', submissionId);
    const score = count ?? 0;
    await service.from('topic_submissions').update({ score }).eq('id', submissionId);
    return NextResponse.json({ ok: true, voted: false, score });
  }

  if (target.author_id === userId) {
    return NextResponse.json(
      { error: "You can't upvote your own submission." },
      { status: 403 }
    );
  }

  await service
    .from('submission_votes')
    .insert({ voter_id: userId, submission_id: submissionId });

  // Recompute the denormalized score from the vote count.
  const { count } = await service
    .from('submission_votes')
    .select('id', { count: 'exact', head: true })
    .eq('submission_id', submissionId);
  const score = count ?? 0;
  await service.from('topic_submissions').update({ score }).eq('id', submissionId);

  return NextResponse.json({ ok: true, voted: true, score });
}
