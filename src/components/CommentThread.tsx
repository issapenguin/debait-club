'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CommentRow } from '@/lib/types';
import { isFounder } from '@/lib/founder';
import { renderRichText, timeAgo } from '@/lib/format';
import { StanceTag } from './StanceTag';
import { UpvoteButton } from './UpvoteButton';
import { ItemMenu } from './ItemMenu';
import { CommentComposer } from './CommentComposer';
import { SortControl, type SortMode } from './SortControl';
import { Avatar } from './Avatar';
import { ChampionBadge } from './ChampionBadge';

function CommentNode({
  comment,
  caseId,
  loggedIn,
  currentUserId,
  depth,
}: {
  comment: CommentRow;
  caseId: number;
  loggedIn: boolean;
  currentUserId: string | null;
  depth: number;
}) {
  const [replying, setReplying] = useState(false);
  const founder = isFounder(comment.author_id);

  return (
    <div className={depth > 0 ? 'ml-4 border-l-2 border-neutral-100 pl-4 sm:ml-6 dark:border-neutral-800' : ''}>
      <div
        className={`rounded-2xl border p-4 ${
          founder
            ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50'
            : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {comment.author ? (
            <Link
              href={`/profile/${comment.author.username}`}
              className={`flex items-center gap-1.5 text-sm font-semibold hover:text-sky-600 dark:hover:text-sky-400 ${
                founder
                  ? 'text-amber-900 dark:text-amber-100'
                  : 'text-neutral-800 dark:text-neutral-100'
              }`}
            >
              <Avatar url={comment.author.avatar_url} username={comment.author.username} className="h-5 w-5 text-[10px]" />
              @{comment.author.username}
              <ChampionBadge badge={comment.author.champion_badge} />
            </Link>
          ) : (
            <span className="text-sm text-neutral-400">deleted user</span>
          )}
          {founder && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Founder
            </span>
          )}
          <StanceTag stance={comment.stance} />
          <span className="text-xs text-neutral-400">{timeAgo(comment.created_at)}</span>
          <div className="ml-auto">
            <ItemMenu
              targetType="comment"
              targetId={comment.id}
              initialSaved={comment.saved}
              loggedIn={loggedIn}
              canDelete={currentUserId !== null && comment.author_id === currentUserId}
            />
          </div>
        </div>
        <p
          className={`mt-2 whitespace-pre-wrap text-[15px] leading-relaxed ${
            founder
              ? 'text-amber-900 dark:text-amber-100'
              : 'text-neutral-800 dark:text-neutral-100'
          }`}
        >
          {renderRichText(comment.body)}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <UpvoteButton
            targetType="comment"
            targetId={comment.id}
            initialVoted={comment.voted}
            initialScore={comment.score}
            loggedIn={loggedIn}
            compact
          />
          <button
            type="button"
            onClick={() => setReplying((r) => !r)}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M9 17l-5-5 5-5M4 12h9a7 7 0 0 1 7 7v1" />
            </svg>
            Reply
          </button>
        </div>
        {replying && (
          <div className="mt-3">
            <CommentComposer
              caseId={caseId}
              parentId={comment.id}
              loggedIn={loggedIn}
              autoFocus
              placeholder={`Reply to @${comment.author?.username ?? 'user'}…`}
              onPosted={() => setReplying(false)}
            />
          </div>
        )}
      </div>
      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              caseId={caseId}
              loggedIn={loggedIn}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function sortComments(comments: CommentRow[], mode: SortMode): CommentRow[] {
  const copy = [...comments];
  copy.sort((a, b) => {
    // Founder comments always bubble to the top.
    const fa = isFounder(a.author_id) ? 0 : 1;
    const fb = isFounder(b.author_id) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    if (mode === 'top') return b.score - a.score || b.id - a.id;
    return b.created_at.localeCompare(a.created_at) || b.id - a.id;
  });
  return copy.map((c) => ({ ...c, replies: sortComments(c.replies, mode) }));
}

/** Threaded comment list with its own Top | New sort control. */
export function CommentThread({
  caseId,
  comments,
  loggedIn,
  currentUserId,
}: {
  caseId: number;
  comments: CommentRow[];
  loggedIn: boolean;
  currentUserId: string | null;
}) {
  const [sort, setSort] = useState<SortMode>('top');
  const sorted = sortComments(comments, sort);
  const total = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section aria-label="Comments" className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Discussion {total > 0 && <span className="text-neutral-400">({total})</span>}
        </h2>
        <SortControl value={sort} onChange={setSort} />
      </div>
      <div className="mt-4">
        <CommentComposer caseId={caseId} loggedIn={loggedIn} />
      </div>
      <div className="mt-6 space-y-4">
        {sorted.map((c) => (
          <CommentNode key={c.id} comment={c} caseId={caseId} loggedIn={loggedIn} currentUserId={currentUserId} depth={0} />
        ))}
        {sorted.length === 0 && (
          <p className="text-sm italic text-neutral-400">
            No comments yet — start the discussion.
          </p>
        )}
      </div>
    </section>
  );
}
