'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_BODY_LENGTH, type Side } from '@/lib/types';
import { LinkInsertButton } from '@/components/LinkInsertButton';

/** Auth-gated composer for posting a FOR or AGAINST case on a topic. */
export function CaseComposer({
  topicId,
  side,
  loggedIn,
}: {
  topicId: number;
  side: Side;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!loggedIn && !open) {
    return (
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="w-full rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-left text-sm text-neutral-500 transition hover:border-sky-400 hover:text-sky-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
      >
        Log in to make your {side === 'for' ? 'FOR' : 'AGAINST'} case
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-left text-sm text-neutral-500 transition hover:border-sky-400 hover:text-sky-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
      >
        Make your {side === 'for' ? 'FOR' : 'AGAINST'} case…
      </button>
    );
  }

  const submit = async () => {
    setError('');
    if (body.trim().length === 0 || body.length > MAX_BODY_LENGTH) {
      setError(`Keep it between 1 and ${MAX_BODY_LENGTH.toLocaleString()} characters.`);
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, side, body }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        setError(json.error ?? 'Could not post your case. Try again.');
        return;
      }
      setBody('');
      setOpen(false);
      router.refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={MAX_BODY_LENGTH}
        autoFocus
        placeholder={`State your ${side === 'for' ? 'FOR' : 'AGAINST'} case. Bring evidence — highlight text and use the link icon to add sources.`}
        className="w-full resize-y rounded-lg bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <LinkInsertButton textareaRef={textareaRef} getValue={() => body} setValue={setBody} />
          <span
            className={`text-xs tabular-nums ${
              body.length >= MAX_BODY_LENGTH ? 'font-semibold text-red-600' : 'text-neutral-400'
            }`}
          >
            {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
          </span>
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setBody('');
              setError('');
            }}
            className="rounded-full px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={sending || body.trim().length === 0}
            className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {sending ? 'Posting…' : 'Post case'}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
