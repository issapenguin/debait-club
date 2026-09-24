'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

// Landed here from the password-reset email (via /auth/callback, which
// exchanges the recovery code for a session). Sets the new password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      setStatus('invalid');
      return;
    }
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? 'ready' : 'invalid');
    };
    check();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const supabase = getBrowserClient();
    if (!supabase) {
      setError('Password reset is not configured yet. Please try again later.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      setStatus('done');
      router.push('/');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-12">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-12 w-12 text-neutral-900 dark:text-neutral-50" />
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Choose a new password
        </h1>
      </div>
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        {status === 'checking' && (
          <p className="text-center text-sm text-neutral-500">Verifying your reset link…</p>
        )}
        {status === 'invalid' && (
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              This reset link is invalid or has expired. Links expire after a short time and can only be used once.
            </p>
            <Link
              href="/forgot-password"
              className="mt-4 inline-block rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Request a new link
            </Link>
          </div>
        )}
        {status === 'ready' && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <p className="mt-1 text-xs text-neutral-400">At least 8 characters.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {busy ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
        {status === 'done' && (
          <p className="text-center text-sm text-emerald-600">Password updated — taking you home…</p>
        )}
      </div>
    </div>
  );
}
