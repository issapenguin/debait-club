'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TargetType } from '@/lib/types';

export function UpvoteButton({
  targetType,
  targetId,
  initialVoted,
  initialScore,
  loggedIn,
  compact = false,
}: {
  targetType: TargetType;
  targetId: number;
  initialVoted: boolean;
  initialScore: number;
  loggedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [score, setScore] = useState(initialScore);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loggedIn) {
      router.push('/login');
      return;
    }
    if (busy) return;
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

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={voted}
      aria-label={voted ? 'Remove your upvote' : 'Upvote'}
      title={voted ? 'Remove your upvote' : 'Upvote'}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${
        voted
          ? 'border-sky-600 bg-sky-600 text-white hover:bg-sky-700 dark:border-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400'
          : 'border-neutral-200 text-neutral-600 hover:border-sky-400 hover:text-sky-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-sky-500 dark:hover:text-sky-400'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={voted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
        aria-hidden="true"
      >
        <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0l4-7a2 2 0 0 1 3.6 1.2L13 9h7a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 17.5 20H7" />
      </svg>
      <span>{score}</span>
    </button>
  );
}
