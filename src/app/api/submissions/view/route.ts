import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { badRequest } from '../../_helpers';

export const dynamic = 'force-dynamic';

// POST /api/submissions/view { submission_id } — records one view. Public;
// best-effort, never fails the caller.
export async function POST(request: Request) {
  const { submission_id } = await request.json().catch(() => ({}));
  const submissionId = Number(submission_id);
  if (!Number.isFinite(submissionId)) return badRequest('A valid submission is required.');

  const service = getServiceClient();
  if (!service) return NextResponse.json({ ok: false });
  const { data } = await service
    .from('topic_submissions')
    .select('view_count')
    .eq('id', submissionId)
    .maybeSingle();
  if (!data) return NextResponse.json({ ok: false });
  await service
    .from('topic_submissions')
    .update({ view_count: ((data as { view_count: number }).view_count ?? 0) + 1 })
    .eq('id', submissionId);
  return NextResponse.json({ ok: true });
}
