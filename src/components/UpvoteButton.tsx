'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoinIcon } from './CoinIcon';
import type { TargetType } from '@/lib/types';

export function UpvoteButton({
  targetType,
  targetId,
  initialVoted,
  initialScore,
  loggedIn,
  compact = false,
  isOwn = false,
  isDeleted = false,
}: {
  targetType: TargetType;
  targetId: number;
  initialVoted: boolean;
  initialScore: number;
  loggedIn: boolean;
  compact?: boolean;
  /** The viewer wrote this content: no self-upvotes. */
  isOwn?: boolean;
  /** Content was archived: upvotes are frozen. */
  isDeleted?: boolean;
}) {
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [score, setScore] = useState(initialScore);
  const [busy, setBusy] = useState(false);

  const disabledByRule = isOwn || isDeleted;

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loggedIn) {
      router.push('/login');
      return;
    }
    if (busy || disabledByRule) return;
    setBusy(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
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

  const label = disabledByRule
    ? isOwn
      ? "You can't upvote your own content"
      : 'This content was archived'
    : voted
      ? 'Take back your d-coin'
      : 'Give a d-coin';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || disabledByRule}
      aria-pressed={voted}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${
        disabledByRule
          ? 'cursor-not-allowed border-neutral-200 text-neutral-300 opacity-60 dark:border-neutral-800 dark:text-neutral-600'
          : voted
            ? 'border-sky-600 bg-sky-600 text-white hover:bg-sky-700 dark:border-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400'
            : 'border-neutral-200 text-neutral-600 hover:border-sky-400 hover:text-sky-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-sky-500 dark:hover:text-sky-400'
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10l5-5 5 5" />
      </svg>
      <CoinIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      <span>{score}</span>
    </button>
  );
}
