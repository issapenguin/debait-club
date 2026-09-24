'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

function OAuthButtons({ mode }: { mode: 'login' | 'signup' }) {
  const [error, setError] = useState('');

  const oauth = async (provider: 'google' | 'apple') => {
    setError('');
    const supabase = getBrowserClient();
    if (!supabase) {
      setError('Sign-in is not configured yet. Please try again later.');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  const label = mode === 'login' ? 'Continue' : 'Sign up';
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => oauth('google')}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.3 7.5 24 12 24z" />
            <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.5 0 10.2 0 12s.5 3.5 1.4 5.1l3.8-2.7z" />
            <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.6l3.8 2.9c1-2.8 3.7-4.8 6.8-4.8z" />
          </svg>
          {label} with Google
        </button>
        <button
          type="button"
          onClick={() => oauth('apple')}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.85-.84 1.54.13 2.7.75 3.47 1.9-3.18 1.9-2.62 6.06.5 7.24-.6 1.58-1.38 3.15-2.9 3.87zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          {label} with Apple
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        or
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const supabase = getBrowserClient();
    if (!supabase) {
      setError('Sign-in is not configured yet. Please try again later.');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      // Backfill a profile row for accounts created before profiles existed.
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
        if (!profile) {
          const base = (data.user.email ?? 'debater').split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '') || 'debater';
          await supabase.from('profiles').insert({
            id: data.user.id,
            username: `${base}${Math.floor(1000 + Math.random() * 9000)}`,
            display_name: base,
          });
        }
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
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
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {busy ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md pt-12">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-12 w-12 text-neutral-900 dark:text-neutral-50" />
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Log in to make cases, vote, and join the discussion.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Suspense>
          <OAuthButtons mode="login" />
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-4 text-center text-sm text-neutral-500">
        New to the club?{' '}
        <Link href="/signup" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
          Join the club
        </Link>
      </p>
    </div>
  );
}
