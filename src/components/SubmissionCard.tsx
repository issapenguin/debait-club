'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CoinIcon } from './CoinIcon';
import { ChampionBadge } from './ChampionBadge';
import { timeAgo } from '@/lib/format';
import type { TopicSubmission } from '@/lib/types';

export function SubmissionCard({
  submission,
  rank,
  loggedIn,
  currentUserId = null,
}: {
  submission: TopicSubmission;
  rank: number;
  loggedIn: boolean;
  currentUserId?: string | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [voted, setVoted] = useState(submission.voted);
  const [score, setScore] = useState(submission.score);
  const [busy, setBusy] = useState(false);
  const [viewPinged, setViewPinged] = useState(false);
  const isOwn = currentUserId !== null && submission.author_id === currentUserId;

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !viewPinged) {
      setViewPinged(true);
      fetch('/api/submissions/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submission.id }),
      }).catch(() => {});
    }
  };

  const toggleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loggedIn) {
      router.push('/login');
      return;
    }
    if (busy) return;
    if (isOwn) return;
    setBusy(true);
    try {
      const res = await fetch('/api/submissions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submission.id }),
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setVoted(json.voted);
        setScore(json.score);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-7 shrink-0 text-center font-display text-lg font-bold text-neutral-300 dark:text-neutral-600">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
              {submission.category}
            </span>
            <span className="text-xs text-neutral-400">
              by{' '}
              {submission.author ? (
                <>
                  <Link
                    href={`/profile/${submission.author.username}`}
                    className="font-semibold text-neutral-500 hover:text-sky-600 dark:text-neutral-400 dark:hover:text-sky-400"
                  >
                    @{submission.author.username}
                  </Link>
                  {submission.author.champion_badge && (
                    <span className="ml-1 inline-flex align-middle">
                      <ChampionBadge badge={submission.author.champion_badge} />
                    </span>
                  )}
                </>
              ) : (
                'a member'
              )}{' '}
              · {timeAgo(submission.created_at)} · {submission.view_count.toLocaleString()} views
            </span>
          </div>
          <button
            type="button"
            onClick={toggleExpand}
            className="mt-1 block w-full text-left font-display text-lg font-semibold leading-snug text-neutral-900 hover:text-sky-700 dark:text-neutral-50 dark:hover:text-sky-300"
          >
            {submission.question}
          </button>
          <p
            className={`mt-1 text-sm text-neutral-600 dark:text-neutral-300 ${
              expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
            }`}
          >
            {submission.context}
          </p>
          {expanded && submission.links.length > 0 && (
            <ul className="mt-2 space-y-1">
              {submission.links.map((link) => (
                <li key={link} className="truncate text-sm">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:underline dark:text-sky-400"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVote}
              disabled={busy || isOwn}
              aria-pressed={voted}
              aria-label={isOwn ? "You can't upvote your own submission" : voted ? 'Take back your d-coin' : 'Give a d-coin'}
              title={isOwn ? "You can't upvote your own submission" : voted ? 'Take back your d-coin' : 'Give a d-coin'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition ${
                isOwn
                  ? 'cursor-not-allowed border-neutral-200 text-neutral-300 opacity-60 dark:border-neutral-800 dark:text-neutral-600'
                  : voted
                    ? 'border-sky-600 bg-sky-600 text-white hover:bg-sky-700 dark:border-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400'
                    : 'border-neutral-200 text-neutral-600 hover:border-sky-400 hover:text-sky-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-sky-500 dark:hover:text-sky-400'
              }`}
            >
              <CoinIcon className="h-4 w-4" />
              <span>{score}</span>
            </button>
            <button
              type="button"
              onClick={toggleExpand}
              className="rounded-full px-3 py-1 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              {expanded ? 'Show less' : 'Details'}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
