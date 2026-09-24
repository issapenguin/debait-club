import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerClient, getSessionUser } from '@/lib/supabase/server';
import { EditBio } from '@/components/EditBio';
import { StanceTag } from '@/components/StanceTag';
import { formatDate, renderRichText, timeAgo } from '@/lib/format';
import type { Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ProfileCase {
  id: number;
  side: string;
  body: string;
  score: number;
  created_at: string;
  topic: { id: number; proposition: string; category: string; topic_date: string } | null;
}

interface ProfileComment {
  id: number;
  body: string;
  stance: 'strongly_agree' | 'agree' | 'neutral' | 'disagree' | 'strongly_disagree';
  score: number;
  created_at: string;
  case: {
    id: number;
    topic: { id: number; proposition: string; category: string; topic_date: string } | null;
  } | null;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await getServerClient();

  let profile: Profile | null = null;
  let cases: ProfileCase[] = [];
  let comments: ProfileComment[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    profile = (data as Profile | null) ?? null;

    if (profile) {
      const [{ data: caseData }, { data: commentData }] = await Promise.all([
        supabase
          .from('cases')
          .select('id, side, body, score, created_at, topic:topics(id, proposition, category, topic_date)')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('comments')
          .select('id, body, stance, score, created_at, case:cases(id, topic:topics(id, proposition, category, topic_date))')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      cases = (caseData ?? []) as unknown as ProfileCase[];
      comments = (commentData ?? []) as unknown as ProfileComment[];
    }
  }

  if (!profile) notFound();

  const user = await getSessionUser();
  const isOwner = user?.id === profile.id;
  const points =
    cases.reduce((n, c) => n + c.score, 0) + comments.reduce((n, c) => n + c.score, 0);

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white">
          {profile.username.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {profile.display_name ?? `@${profile.username}`}
          </h1>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
        </div>
        <span className="ml-auto text-right">
          <span className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {points.toLocaleString()}
          </span>{' '}
          <span className="text-sm text-neutral-400">pts</span>
        </span>
      </div>

      {profile.bio && !isOwner && (
        <p className="mt-4 max-w-md whitespace-pre-wrap text-[15px] text-neutral-600 dark:text-neutral-300">
          {profile.bio}
        </p>
      )}
      {isOwner && <EditBio initialBio={profile.bio ?? ''} />}
      {isOwner && !profile.bio && (
        <p className="mt-2 text-sm italic text-neutral-400">No bio yet.</p>
      )}

      <section className="mt-10" aria-label="Cases by this user">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Cases ({cases.length})
        </h2>
        {cases.length === 0 ? (
          <p className="text-sm italic text-neutral-400">No cases yet.</p>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/topic/${c.topic?.id ?? ''}`}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      c.side === 'for'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                    }`}
                  >
                    {c.side === 'for' ? 'FOR' : 'AGAINST'}
                  </span>
                  {c.topic && (
                    <>
                      <span className="font-semibold text-neutral-500">{c.topic.category}</span>
                      <span className="text-neutral-400">{formatDate(c.topic.topic_date)}</span>
                    </>
                  )}
                  <span className="ml-auto font-semibold text-neutral-500">{c.score} pts</span>
                </div>
                {c.topic && (
                  <p className="font-display mt-2 font-semibold text-neutral-900 dark:text-neutral-50">
                    {c.topic.proposition}
                  </p>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
                  {c.body}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10" aria-label="Comments by this user">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Comments ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm italic text-neutral-400">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <Link
                key={c.id}
                href={`/topic/${c.case?.topic?.id ?? ''}`}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StanceTag stance={c.stance} />
                  <span className="text-xs text-neutral-400">{timeAgo(c.created_at)}</span>
                  <span className="ml-auto text-xs font-semibold text-neutral-500">
                    {c.score} pts
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">
                  {renderRichText(c.body)}
                </p>
                {c.case?.topic && (
                  <p className="mt-2 text-xs text-neutral-400">
                    {c.case.topic.category} · {formatDate(c.case.topic.topic_date)} ·{' '}
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">
                      {c.case.topic.proposition.slice(0, 80)}
                      {c.case.topic.proposition.length > 80 ? '…' : ''}
                    </span>
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
