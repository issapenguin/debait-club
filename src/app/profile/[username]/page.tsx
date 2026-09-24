import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerClient, getSessionUser } from '@/lib/supabase/server';
import { isFounder } from '@/lib/founder';
import { Avatar } from '@/components/Avatar';
import { AvatarEditor } from '@/components/AvatarEditor';
import { EditBio } from '@/components/EditBio';
import { StanceTag } from '@/components/StanceTag';
import { CoinIcon } from '@/components/CoinIcon';
import { ChampionBadge, championBadgeLabel } from '@/components/ChampionBadge';
import { formatDate, renderRichText, timeAgo } from '@/lib/format';
import type { Profile, Stance } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ProfileCase {
  id: number;
  side: string;
  body: string;
  score: number;
  created_at: string;
  topic: { id: number; proposition: string; category: string; topic_date: string } | null;
}

interface ProfileSubmission {
  id: number;
  question: string;
  category: string;
  score: number;
  created_at: string;
}

interface ProfileComment {
  id: number;
  body: string;
  stance: Stance;
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
  let submissions: ProfileSubmission[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    profile = (data as Profile | null) ?? null;

    if (profile) {
      const [{ data: caseData }, { data: commentData }, { data: submissionData }] =
        await Promise.all([
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
          supabase
            .from('topic_submissions')
            .select('id, question, category, score, created_at')
            .eq('author_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(50),
        ]);
      cases = (caseData ?? []) as unknown as ProfileCase[];
      comments = (commentData ?? []) as unknown as ProfileComment[];
      submissions = (submissionData ?? []) as unknown as ProfileSubmission[];
    }
  }

  if (!profile) notFound();

  const user = await getSessionUser();
  const isOwner = user?.id === profile.id;
  const points =
    cases.reduce((n, c) => n + c.score, 0) +
    comments.reduce((n, c) => n + c.score, 0) +
    submissions.reduce((n, s) => n + s.score, 0);

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <div className="flex items-start gap-5">
        {isOwner ? (
          <AvatarEditor userId={profile.id} username={profile.username} initialUrl={profile.avatar_url} />
        ) : (
          <Avatar url={profile.avatar_url} username={profile.username} className="h-20 w-20 text-3xl" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 font-display text-[28px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {profile.display_name ?? `@${profile.username}`}
            <ChampionBadge badge={profile.champion_badge} className="h-6 w-6" />
          </h1>
          <p className="mt-0.5 text-[15px] text-neutral-500 dark:text-neutral-400">@{profile.username}</p>
          {profile.champion_badge && (
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              {championBadgeLabel(profile.champion_badge)}
            </p>
          )}
          {profile.bio && (
            <p className="mt-3 max-w-md whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              {profile.bio}
            </p>
          )}
          {isOwner && !profile.bio && (
            <p className="mt-3 text-sm italic text-neutral-400">No bio yet.</p>
          )}
          {isOwner && <EditBio initialBio={profile.bio ?? ''} />}
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 pt-1.5 text-right">
          <CoinIcon className="h-6 w-6" />
          <span className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {isFounder(profile.id) ? '∞' : points.toLocaleString()}
          </span>
        </span>
      </div>

      {!isFounder(profile.id) && (
      <>
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
                  <span className="ml-auto flex items-center gap-1 font-semibold text-neutral-500">
                    <CoinIcon className="h-3.5 w-3.5" />
                    {c.score}
                  </span>
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
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-neutral-500">
                    <CoinIcon className="h-3.5 w-3.5" />
                    {c.score}
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
      <section className="mt-10" aria-label="Topic submissions by this user">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Submitted topics ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <p className="text-sm italic text-neutral-400">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <Link
                key={s.id}
                href="/submit"
                className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
                    {s.category}
                  </span>
                  <span className="text-xs text-neutral-400">{timeAgo(s.created_at)}</span>
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-neutral-500">
                    <CoinIcon className="h-3.5 w-3.5" />
                    {s.score}
                  </span>
                </div>
                <p className="mt-2 font-display font-semibold text-neutral-900 dark:text-neutral-50">
                  {s.question}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}
