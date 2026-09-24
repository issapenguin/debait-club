import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerClient, getSessionUser } from '@/lib/supabase/server';
import { CaseCard } from '@/components/CaseCard';
import { renderRichText, timeAgo } from '@/lib/format';
import { StanceTag } from '@/components/StanceTag';
import { UpvoteButton } from '@/components/UpvoteButton';
import { ItemMenu } from '@/components/ItemMenu';
import { Avatar } from '@/components/Avatar';
import type { CaseRow, CommentRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface HistoryComment extends CommentRow {
  case: {
    id: number;
    topic: { id: number; proposition: string; category: string; topic_date: string } | null;
  } | null;
}

function HistoryCommentCard({ comment }: { comment: HistoryComment }) {
  const topic = comment.case?.topic;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          <Avatar url={comment.author?.avatar_url} username={comment.author?.username ?? 'user'} className="h-5 w-5 text-[10px]" />
          @{comment.author?.username ?? 'deleted user'}
        </span>
        <StanceTag stance={comment.stance} />
        <span className="text-xs text-neutral-400">{timeAgo(comment.created_at)}</span>
        <div className="ml-auto">
          <ItemMenu
            targetType="comment"
            targetId={comment.id}
            initialSaved={comment.saved}
            loggedIn
          />
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-100">
        {renderRichText(comment.body)}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <UpvoteButton
          targetType="comment"
          targetId={comment.id}
          initialVoted={comment.voted}
          initialScore={comment.score}
          loggedIn
          compact
        />
        {topic && (
          <Link
            href={`/case/${comment.case_id}`}
            className="text-xs text-sky-600 hover:underline dark:text-sky-400"
          >
            View in “{topic.proposition.slice(0, 60)}…”
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/history');

  const supabase = await getServerClient();
  let cases: (CaseRow & { saved: boolean; voted: boolean })[] = [];
  let comments: HistoryComment[] = [];

  if (supabase) {
    const [{ data: savedItems }, { data: voteRows }] = await Promise.all([
      supabase
        .from('saved_items')
        .select('target_type, target_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('votes')
        .select('target_type, target_id')
        .eq('voter_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const savedCaseIds = new Set(
      ((savedItems ?? []) as { target_type: string; target_id: number }[])
        .filter((i) => i.target_type === 'case')
        .map((i) => i.target_id)
    );
    const savedCommentIds = new Set(
      ((savedItems ?? []) as { target_type: string; target_id: number }[])
        .filter((i) => i.target_type === 'comment')
        .map((i) => i.target_id)
    );
    const votedCaseIds = new Set(
      ((voteRows ?? []) as { target_type: string; target_id: number }[])
        .filter((i) => i.target_type === 'case')
        .map((i) => i.target_id)
    );
    const votedCommentIds = new Set(
      ((voteRows ?? []) as { target_type: string; target_id: number }[])
        .filter((i) => i.target_type === 'comment')
        .map((i) => i.target_id)
    );

    const caseIds = [...new Set([...savedCaseIds, ...votedCaseIds])];
    const commentIds = [...new Set([...savedCommentIds, ...votedCommentIds])];

    if (caseIds.length > 0) {
      const { data } = await supabase
        .from('cases')
        .select('*, author:profiles(username, display_name, avatar_url), topic:topics(id, proposition, category, topic_date)')
        .in('id', caseIds);
      cases = ((data ?? []) as (CaseRow & {
        topic: { id: number; proposition: string; category: string; topic_date: string } | null;
      })[]).map((c) => ({
        ...c,
        comment_count: 0,
        saved: savedCaseIds.has(c.id),
        voted: votedCaseIds.has(c.id),
      }));
    }

    if (commentIds.length > 0) {
      const { data } = await supabase
        .from('comments')
        .select('*, author:profiles(username, display_name, avatar_url), case:cases(id, topic:topics(id, proposition, category, topic_date))')
        .in('id', commentIds);
      comments = ((data ?? []) as unknown as HistoryComment[]).map((c) => ({
        ...c,
        saved: savedCommentIds.has(c.id),
        voted: votedCommentIds.has(c.id),
        replies: [],
      }));
    }
  }

  const savedCases = cases.filter((c) => c.saved);
  const savedComments = comments.filter((c) => c.saved);
  const upvotedCases = cases.filter((c) => c.voted);
  const upvotedComments = comments.filter((c) => c.voted);
  const empty =
    savedCases.length === 0 &&
    savedComments.length === 0 &&
    upvotedCases.length === 0 &&
    upvotedComments.length === 0;

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        History
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Everything you have saved and upvoted. Tap the coin again to remove an
        upvote, or the “…” menu to remove a save.
      </p>

      {empty ? (
        <p className="mt-10 text-center text-sm italic text-neutral-400">
          Nothing here yet. Upvote or save cases and comments to build your history.
        </p>
      ) : (
        <>
          {(savedCases.length > 0 || savedComments.length > 0) && (
            <section className="mt-8" aria-label="Saved items">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                Saved
              </h2>
              <div className="space-y-4">
                {savedCases.map((c) => (
                  <CaseCard key={`saved-case-${c.id}`} caseRow={c} loggedIn />
                ))}
                {savedComments.map((c) => (
                  <HistoryCommentCard key={`saved-comment-${c.id}`} comment={c} />
                ))}
              </div>
            </section>
          )}
          {(upvotedCases.length > 0 || upvotedComments.length > 0) && (
            <section className="mt-10" aria-label="Upvoted items">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                Upvoted
              </h2>
              <div className="space-y-4">
                {upvotedCases.map((c) => (
                  <CaseCard key={`voted-case-${c.id}`} caseRow={c} loggedIn />
                ))}
                {upvotedComments.map((c) => (
                  <HistoryCommentCard key={`voted-comment-${c.id}`} comment={c} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
