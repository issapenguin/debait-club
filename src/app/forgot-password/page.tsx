'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const supabase = getBrowserClient();
    if (!supabase) {
      setError('Password reset is not configured yet. Please try again later.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // Always show the same notice so we don't reveal whether an account exists.
      setNotice('If an account exists for that email, a reset link is on its way. Check your inbox.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-12">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-12 w-12 text-neutral-900 dark:text-neutral-50" />
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Enter your email and we&rsquo;ll send you a link to choose a new password.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-600">{notice}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-neutral-500">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
