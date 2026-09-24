// Shared server-side data fetching for pages and API routes.
import { getServerClient, getSessionUser, getServiceClient } from './supabase/server';
import type {
  CaseRow,
  CommentRow,
  Profile,
  SubmissionSort,
  Topic,
  TopicSubmission,
} from './types';

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

export async function fetchTopics(): Promise<Topic[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('topic_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data as Topic[];
}

export async function fetchCaseCounts(topicIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (topicIds.length === 0) return counts;
  const supabase = await getServerClient();
  if (!supabase) return counts;
  const { data } = await supabase
    .from('cases')
    .select('topic_id')
    .in('topic_id', topicIds);
  for (const row of (data ?? []) as { topic_id: number }[]) {
    counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
  }
  return counts;
}

export interface TabSelection {
  featured: Topic | null;
  byCategory: Record<string, Topic | null>;
}

/** Picks exactly one topic per tab per the home-page tab rules. */
export function pickTabTopics(
  topics: Topic[],
  caseCounts: Map<number, number>
): TabSelection {
  const sorted = [...topics].sort(
    (a, b) => b.topic_date.localeCompare(a.topic_date) || b.id - a.id
  );
  const latestDate = sorted[0]?.topic_date;
  const featured =
    sorted.find((t) => t.is_featured && t.topic_date === latestDate) ??
    sorted.find((t) => t.is_featured) ??
    sorted[0] ??
    null;

  const byCategory: Record<string, Topic | null> = {};
  for (const cat of ['Business', 'Entertainment', 'Lifestyle', 'Politics', 'Sports']) {
    const inCat = sorted.filter((t) => t.category === cat);
    byCategory[cat] =
      inCat.find((t) => (caseCounts.get(t.id) ?? 0) > 0) ?? inCat[0] ?? null;
  }
  return { featured, byCategory };
}

interface AuthorRef {
  username: string;
  display_name: string | null;
}

async function fetchVoteSaveSets(
  userId: string | null,
  targetType: 'case' | 'comment',
  targetIds: number[]
): Promise<{ voted: Set<number>; saved: Set<number> }> {
  const empty = { voted: new Set<number>(), saved: new Set<number>() };
  if (!userId || targetIds.length === 0) return empty;
  const supabase = await getServerClient();
  if (!supabase) return empty;
  const [votesRes, savedRes] = await Promise.all([
    supabase
      .from('votes')
      .select('target_id')
      .eq('voter_id', userId)
      .eq('target_type', targetType)
      .in('target_id', targetIds),
    supabase
      .from('saved_items')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .in('target_id', targetIds),
  ]);
  return {
    voted: new Set((votesRes.data ?? []).map((r: { target_id: number }) => r.target_id)),
    saved: new Set((savedRes.data ?? []).map((r: { target_id: number }) => r.target_id)),
  };
}

export async function fetchCasesForTopic(
  topicId: number,
  userId: string | null
): Promise<CaseRow[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cases')
    .select('*, author:profiles(username, display_name)')
    .eq('topic_id', topicId)
    .order('score', { ascending: false })
    .order('id', { ascending: false });
  if (error || !data) return [];

  const ids = (data as { id: number }[]).map((c) => c.id);
  const { data: comments } = await supabase
    .from('comments')
    .select('case_id')
    .in('case_id', ids.length > 0 ? ids : [-1]);
  const commentCounts = new Map<number, number>();
  for (const row of (comments ?? []) as { case_id: number }[]) {
    commentCounts.set(row.case_id, (commentCounts.get(row.case_id) ?? 0) + 1);
  }
  const { voted, saved } = await fetchVoteSaveSets(userId, 'case', ids);

  return (data as (Omit<CaseRow, 'author' | 'comment_count' | 'voted' | 'saved'> & { author: AuthorRef | null })[]).map(
    (c) => ({
      ...c,
      author: c.author,
      comment_count: commentCounts.get(c.id) ?? 0,
      voted: voted.has(c.id),
      saved: saved.has(c.id),
    })
  );
}

export interface CaseDetail {
  caseRow: CaseRow;
  topic: Topic;
  comments: CommentRow[];
}

export async function fetchCaseDetail(
  caseId: number,
  userId: string | null
): Promise<CaseDetail | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*, author:profiles(username, display_name)')
    .eq('id', caseId)
    .single();
  if (error || !caseData) return null;

  const { data: topicData } = await supabase
    .from('topics')
    .select('*')
    .eq('id', caseData.topic_id)
    .single();
  if (!topicData) return null;

  const { data: commentData } = await supabase
    .from('comments')
    .select('*, author:profiles(username, display_name)')
    .eq('case_id', caseId)
    .order('score', { ascending: false })
    .order('id', { ascending: true });

  const commentIds = ((commentData ?? []) as { id: number }[]).map((c) => c.id);
  const { voted, saved } = await fetchVoteSaveSets(userId, 'comment', commentIds);
  const caseSets = await fetchVoteSaveSets(userId, 'case', [caseId]);

  const flat: CommentRow[] = ((commentData ?? []) as (Omit<
    CommentRow,
    'author' | 'voted' | 'saved' | 'replies'
  > & { author: AuthorRef | null })[]).map((c) => ({
    ...c,
    author: c.author,
    voted: voted.has(c.id),
    saved: saved.has(c.id),
    replies: [],
  }));

  const byId = new Map(flat.map((c) => [c.id, c]));
  const roots: CommentRow[] = [];
  for (const c of flat) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.replies.push(c);
    } else {
      roots.push(c);
    }
  }

  const caseRow: CaseRow = {
    ...(caseData as Omit<CaseRow, 'comment_count' | 'voted' | 'saved'>),
    comment_count: flat.length,
    voted: caseSets.voted.has(caseId),
    saved: caseSets.saved.has(caseId),
  };

  return { caseRow, topic: topicData as Topic, comments: roots };
}

export interface Champion {
  username: string;
  display_name: string | null;
  points: number;
}

// ---------------------------------------------------------------------------
// Topic submissions
// ---------------------------------------------------------------------------

// Reddit-style "hot" ranking, mirroring reddit's algorithm: log-scaled vote
// count plus a time term, so a submission gaining d-coins quickly outranks an
// older one with the same total. Epoch and divisor match reddit's own values.
const REDDIT_EPOCH = 1134028003; // 2005-12-08T07:46:43Z
const HOT_DIVISOR = 45000;

export function hotScore(score: number, createdAt: string): number {
  const order = Math.log10(Math.max(score, 1));
  const seconds = Date.parse(createdAt) / 1000 - REDDIT_EPOCH;
  return order + seconds / HOT_DIVISOR;
}

export interface SubmissionQuery {
  week: string;
  sort: SubmissionSort;
  category?: string;
  limit?: number;
}

export async function fetchSubmissions(
  query: SubmissionQuery,
  userId: string | null
): Promise<TopicSubmission[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('topic_submissions')
    .select('*, author:profiles(username, display_name)')
    .eq('week_of', query.week)
    .order('created_at', { ascending: false })
    .limit(query.limit ?? 500);
  if (error || !data) return [];

  let rows = (data as (Omit<
    TopicSubmission,
    'author' | 'voted'
  > & { author: AuthorRef | null })[]).filter(
    (r) => !query.category || r.category === query.category
  );

  if (query.sort === 'top') {
    rows = [...rows].sort(
      (a, b) => b.score - a.score || +new Date(b.created_at) - +new Date(a.created_at)
    );
  } else if (query.sort === 'trending') {
    rows = [...rows].sort(
      (a, b) => hotScore(b.score, b.created_at) - hotScore(a.score, a.created_at)
    );
  }

  const ids = rows.map((r) => r.id);
  let votedSet = new Set<number>();
  if (userId && ids.length > 0) {
    const { data: votes } = await supabase
      .from('submission_votes')
      .select('submission_id')
      .eq('voter_id', userId)
      .in('submission_id', ids);
    votedSet = new Set(((votes ?? []) as { submission_id: number }[]).map((v) => v.submission_id));
  }

  return rows.map((r) => ({
    ...r,
    links: Array.isArray(r.links) ? r.links : [],
    voted: votedSet.has(r.id),
  }));
}

export interface SubmissionLeaders {
  overall: TopicSubmission | null;
  byCategory: Record<string, TopicSubmission | null>;
}

/** This week's leaders: top-voted overall and top-voted per category. */
export async function fetchSubmissionLeaders(
  week: string,
  userId: string | null
): Promise<SubmissionLeaders> {
  const top = await fetchSubmissions({ week, sort: 'top', limit: 500 }, userId);
  const overall = top[0] ?? null;
  const byCategory: Record<string, TopicSubmission | null> = {};
  for (const cat of ['Business', 'Entertainment', 'Lifestyle', 'Politics', 'Sports']) {
    byCategory[cat] = top.find((s) => s.category === cat) ?? null;
  }
  return { overall, byCategory };
}

export async function fetchChampions(limit = 50): Promise<Champion[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const [
    { data: caseScores },
    { data: commentScores },
    { data: submissionScores },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('cases').select('author_id, score'),
    supabase.from('comments').select('author_id, score'),
    supabase.from('topic_submissions').select('author_id, score'),
    supabase.from('profiles').select('id, username, display_name'),
  ]);
  const points = new Map<string, number>();
  for (const row of [
    ...((caseScores ?? []) as { author_id: string | null; score: number }[]),
    ...((commentScores ?? []) as { author_id: string | null; score: number }[]),
    ...((submissionScores ?? []) as { author_id: string | null; score: number }[]),
  ]) {
    if (!row.author_id) continue;
    points.set(row.author_id, (points.get(row.author_id) ?? 0) + (row.score ?? 0));
  }
  const byId = new Map(
    ((profiles ?? []) as Pick<Profile, 'id' | 'username' | 'display_name'>[]).map((p) => [p.id, p])
  );
  return [...points.entries()]
    .map(([id, pts]) => {
      const p = byId.get(id);
      return { username: p?.username ?? 'unknown', display_name: p?.display_name ?? null, points: pts };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

/** Ensures a profiles row exists for an auth user (used by API routes and OAuth). */
export async function ensureProfileForUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<void> {
  const service = getServiceClient();
  if (!service) return;
  const { data: existing } = await service
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return;

  const metaName =
    typeof user.user_metadata?.['username'] === 'string'
      ? (user.user_metadata['username'] as string)
      : typeof user.user_metadata?.['display_name'] === 'string'
        ? (user.user_metadata['display_name'] as string)
        : '';
  const base =
    metaName
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, '')
      .slice(0, 20) ||
    (user.email ?? 'debater').split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '') ||
    'debater';

  let username = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: taken } = await service
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (!taken) break;
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const displayName =
    typeof user.user_metadata?.['display_name'] === 'string'
      ? (user.user_metadata['display_name'] as string)
      : typeof user.user_metadata?.['full_name'] === 'string'
        ? (user.user_metadata['full_name'] as string)
        : username;

  await service.from('profiles').insert({
    id: user.id,
    username,
    display_name: displayName.slice(0, 80),
  });
}
