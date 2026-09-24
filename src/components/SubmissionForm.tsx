'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUBMISSION_CATEGORIES } from '@/lib/types';

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';

export function SubmissionForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [links, setLinks] = useState('');
  const [category, setCategory] = useState<string>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!question.trim() || !context.trim() || !links.trim() || !category) {
      setError('All four are required: question, context, links, and a category.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, links, category }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? 'Could not submit your topic. Try again.');
        return;
      }
      setQuestion('');
      setContext('');
      setLinks('');
      setCategory('');
      setNotice('Submitted. The club votes all week — rally your d-coins.');
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="sub-question" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Debate question
        </label>
        <input
          id="sub-question"
          type="text"
          required
          maxLength={300}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Should cities ban cars from downtown cores?"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="sub-context" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Context
        </label>
        <textarea
          id="sub-context"
          required
          maxLength={2000}
          rows={4}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Why is this worth debating? What's at stake, and for whom?"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="sub-links" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Relevant links <span className="font-normal text-neutral-400">(one per line)</span>
        </label>
        <textarea
          id="sub-links"
          required
          rows={2}
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder={'https://example.com/article\nhttps://example.com/data'}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="sub-category" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Category
        </label>
        <select
          id="sub-category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Pick a category
          </option>
          {SUBMISSION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      {notice && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{notice}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {busy ? 'Submitting…' : 'Submit topic'}
      </button>
    </form>
  );
}
