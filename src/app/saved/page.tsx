import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerClient, getSessionUser } from '@/lib/supabase/server';
import { CaseCard } from '@/components/CaseCard';
import { renderRichText, timeAgo } from '@/lib/format';
import { StanceTag } from '@/components/StanceTag';
import { UpvoteButton } from '@/components/UpvoteButton';
import { ItemMenu } from '@/components/ItemMenu';
import type { CaseRow, CommentRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface SavedComment extends CommentRow {
  case: {
    id: number;
    topic: { id: number; proposition: string; category: string; topic_date: string } | null;
  } | null;
}

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/saved');

  const supabase = await getServerClient();
  let savedCases: CaseRow[] = [];
  let savedComments: SavedComment[] = [];

  if (supabase) {
    const { data: items } = await supabase
      .from('saved_items')
      .select('target_type, target_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const caseIds = (items ?? [])
      .filter((i: { target_type: string }) => i.target_type === 'case')
      .map((i: { target_id: number }) => i.target_id);
    const commentIds = (items ?? [])
      .filter((i: { target_type: string }) => i.target_type === 'comment')
      .map((i: { target_id: number }) => i.target_id);

    if (caseIds.length > 0) {
      const { data } = await supabase
        .from('cases')
        .select('*, author:profiles(username, display_name), topic:topics(id, proposition, category, topic_date)')
        .in('id', caseIds);
      const { data: votes } = await supabase
        .from('votes')
        .select('target_id')
        .eq('voter_id', user.id)
        .eq('target_type', 'case')
        .in('target_id', caseIds);
      const voted = new Set((votes ?? []).map((v: { target_id: number }) => v.target_id));
      savedCases = ((data ?? []) as (CaseRow & {
        topic: { id: number; proposition: string; category: string; topic_date: string } | null;
      })[]).map((c) => ({ ...c, comment_count: 0, voted: voted.has(c.id), saved: true }));
    }

    if (commentIds.length > 0) {
      const { data } = await supabase
        .from('comments')
        .select('*, author:profiles(username, display_name), case:cases(id, topic:topics(id, proposition, category, topic_date))')
        .in('id', commentIds);
      const { data: votes } = await supabase
        .from('votes')
        .select('target_id')
        .eq('voter_id', user.id)
        .eq('target_type', 'comment')
        .in('target_id', commentIds);
      const voted = new Set((votes ?? []).map((v: { target_id: number }) => v.target_id));
      savedComments = ((data ?? []) as unknown as SavedComment[]).map((c) => ({
        ...c,
        voted: voted.has(c.id),
        saved: true,
        replies: [],
      }));
    }
  }

  const empty = savedCases.length === 0 && savedComments.length === 0;

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Saved
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Everything you have bookmarked, in one place.
      </p>

      {empty ? (
        <p className="mt-10 text-center text-sm italic text-neutral-400">
          Nothing saved yet. Tap the “…” menu on any case or comment to save it.
        </p>
      ) : (
        <>
          {savedCases.length > 0 && (
            <section className="mt-8" aria-label="Saved cases">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                Cases
              </h2>
              <div className="space-y-4">
                {savedCases.map((c) => (
                  <CaseCard key={c.id} caseRow={c} loggedIn />
                ))}
              </div>
            </section>
          )}
          {savedComments.length > 0 && (
            <section className="mt-8" aria-label="Saved comments">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                Comments
              </h2>
              <div className="space-y-4">
                {savedComments.map((c) => {
                  const topic = c.case?.topic;
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          @{c.author?.username ?? 'deleted user'}
                        </span>
                        <StanceTag stance={c.stance} />
                        <span className="text-xs text-neutral-400">{timeAgo(c.created_at)}</span>
                        <div className="ml-auto">
                          <ItemMenu targetType="comment" targetId={c.id} initialSaved loggedIn />
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-100">
                        {renderRichText(c.body)}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <UpvoteButton
                          targetType="comment"
                          targetId={c.id}
                          initialVoted={c.voted}
                          initialScore={c.score}
                          loggedIn
                          compact
                        />
                        {topic && (
                          <Link
                            href={`/case/${c.case_id}`}
                            className="text-xs text-sky-600 hover:underline dark:text-sky-400"
                          >
                            View in “{topic.proposition.slice(0, 60)}…”
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
