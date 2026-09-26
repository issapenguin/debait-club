'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CaseRow } from '@/lib/types';
import { renderRichText, timeAgo } from '@/lib/format';
import { UpvoteButton } from './UpvoteButton';
import { ItemMenu } from './ItemMenu';
import { Avatar } from './Avatar';
import { ChampionBadge } from './ChampionBadge';

export function CaseCard({
  caseRow,
  loggedIn,
  currentUserId = null,
}: {
  caseRow: CaseRow;
  loggedIn: boolean;
  currentUserId?: string | null;
}) {
  const router = useRouter();
  const isFor = caseRow.side === 'for';
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/case/${caseRow.id}`
      : `/case/${caseRow.id}`;

  return (
    <article
      onClick={() => router.push(`/case/${caseRow.id}`)}
      className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${
            isFor
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
          }`}
        >
          {isFor ? 'FOR' : 'AGAINST'}
        </span>
        {caseRow.author ? (
          <Link
            href={`/profile/${caseRow.author.username}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-sky-600 dark:text-neutral-400 dark:hover:text-sky-400"
          >
            <Avatar url={caseRow.author.avatar_url} username={caseRow.author.username} className="h-5 w-5 text-[10px]" />
            @{caseRow.author.username}
            <ChampionBadge badge={caseRow.author.champion_badge} />
          </Link>
        ) : (
          <span className="text-sm text-neutral-400">deleted user</span>
        )}
        <span className="text-xs text-neutral-400">{timeAgo(caseRow.created_at)}</span>
        <div className="ml-auto">
          <ItemMenu
            targetType="case"
            targetId={caseRow.id}
            initialSaved={caseRow.saved}
            loggedIn={loggedIn}
            showShare
            shareUrl={shareUrl}
          />
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-100">
        {caseRow.is_deleted ? (
          <span className="italic text-neutral-400 dark:text-neutral-500">archived</span>
        ) : (
          renderRichText(caseRow.body)
        )}
      </p>

      <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <UpvoteButton
          targetType="case"
          targetId={caseRow.id}
          initialVoted={caseRow.voted}
          initialScore={caseRow.score}
          loggedIn={loggedIn}
          isOwn={currentUserId !== null && caseRow.author_id === currentUserId}
          isDeleted={caseRow.is_deleted}
        />
        <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" />
          </svg>
          {caseRow.comment_count} {caseRow.comment_count === 1 ? 'comment' : 'comments'}
        </span>
      </div>
    </article>
  );
}
