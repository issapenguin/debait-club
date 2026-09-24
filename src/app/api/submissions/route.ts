import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';
import { getServerClient, getSessionUser } from '@/lib/supabase/server';
import { fetchSubmissions } from '@/lib/data';
import { moderate } from '@/lib/moderation';
import { SUBMISSION_CATEGORIES, weekOf, type SubmissionSort } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SORTS: SubmissionSort[] = ['top', 'new', 'trending'];

// GET /api/submissions?week=YYYY-MM-DD&sort=top|new|trending&category=Business — public.
export async function GET(request: Request) {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Backend is not configured.' }, { status: 503 });
  }
  const url = new URL(request.url);
  const week = url.searchParams.get('week') ?? weekOf();
  const sortParam = url.searchParams.get('sort');
  const sort: SubmissionSort = SORTS.includes(sortParam as SubmissionSort)
    ? (sortParam as SubmissionSort)
    : 'trending';
  const category = url.searchParams.get('category') ?? undefined;
  if (category && !(SUBMISSION_CATEGORIES as readonly string[]).includes(category)) {
    return badRequest('Unknown category.');
  }

  const user = await getSessionUser();
  const submissions = await fetchSubmissions(
    { week, sort, category, limit: 200 },
    user?.id ?? null
  );
  return NextResponse.json({ submissions, week, sort });
}

function parseLinks(input: unknown): string[] | null {
  const raw = Array.isArray(input) ? input : typeof input === 'string' ? input.split('\n') : null;
  if (!raw) return null;
  const links = raw
    .map((l) => String(l).trim())
    .filter((l) => l.length > 0)
    .slice(0, 10);
  if (links.length === 0) return null;
  for (const link of links) {
    try {
      const u = new URL(link);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    } catch {
      return null;
    }
  }
  return links;
}

// POST /api/submissions { question, context, links, category } — auth required.
export async function POST(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const { question, context, links: linksInput, category } = await request
    .json()
    .catch(() => ({}));

  const cleanQuestion = typeof question === 'string' ? question.trim().slice(0, 300) : '';
  if (!cleanQuestion) return badRequest('A debate question is required.');
  const cleanContext = typeof context === 'string' ? context.trim().slice(0, 2000) : '';
  if (!cleanContext) return badRequest('Some context is required.');
  const links = parseLinks(linksInput);
  if (!links) return badRequest('At least one valid http(s) link is required.');
  if (!(SUBMISSION_CATEGORIES as readonly string[]).includes(category)) {
    return badRequest('Pick one of the club categories.');
  }

  const check = moderate(`${cleanQuestion}\n${cleanContext}`);
  if (!check.ok) return badRequest(check.reason ?? 'Not allowed.');

  const { data, error } = await service
    .from('topic_submissions')
    .insert({
      author_id: userId,
      question: cleanQuestion,
      context: cleanContext,
      links,
      category,
      week_of: weekOf(),
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('topic_submissions insert failed', error);
    return NextResponse.json({ error: 'Could not save your submission.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: (data as { id: number }).id });
}
