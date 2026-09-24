'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STANCES, STANCE_LABELS, type Stance } from '@/lib/types';

/** Comment composer with a stance picker and character counter. */
export function CommentComposer({
  caseId,
  parentId = null,
  loggedIn,
  onPosted,
  autoFocus = false,
  placeholder = 'Add your take…',
}: {
  caseId: number;
  parentId?: number | null;
  loggedIn: boolean;
  onPosted?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [stance, setStance] = useState<Stance>('neutral');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (!loggedIn) {
    return (
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="w-full rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-left text-sm text-neutral-500 transition hover:border-sky-400 hover:text-sky-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
      >
        Log in to join the discussion
      </button>
    );
  }

  const submit = async () => {
    setError('');
    if (body.trim().length === 0) {
      setError('Write something before posting.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, parent_id: parentId, body, stance }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        setError(json.error ?? 'Could not post your comment. Try again.');
        return;
      }
      setBody('');
      setStance('neutral');
      onPosted?.();
      router.refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Your stance">
        {STANCES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStance(s)}
            aria-pressed={stance === s}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              stance === s
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
            }`}
          >
            {STANCE_LABELS[s]}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <span className="mr-auto text-xs tabular-nums text-neutral-400">
          {body.length.toLocaleString()} characters
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={sending || body.trim().length === 0}
          className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {sending ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
