'use client';

import { useState } from 'react';

export function ContactForm({
  loggedIn,
  asLabel,
}: {
  loggedIn: boolean;
  asLabel: string | null;
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subject.trim() || !message.trim()) {
      setError('Please add a subject and a message.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? 'Could not send your message. Please try again.');
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Message sent.
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Thanks for reaching out. We read everything and will reply if needed.
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-sky-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {loggedIn && asLabel && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Sending as <span className="font-semibold text-neutral-700 dark:text-neutral-200">{asLabel}</span>
        </p>
      )}
      {!loggedIn && (
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Your email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      )}
      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          maxLength={140}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind."
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {busy ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
