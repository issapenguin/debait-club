'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';

function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (displayName.trim().toLowerCase() === username.trim().toLowerCase()) {
      setError('Your display name and username need to be different.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          username,
          email,
          password,
          birth_date: birthDate,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? 'Could not create your account. Try again.');
        return;
      }
      if (json.confirmed) {
        router.push('/');
        router.refresh();
      } else {
        setNotice('Account created — check your email to confirm, then log in.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="What should the club call you?"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Username
        </label>
        <input
          id="username"
          type="text"
          required
          minLength={3}
          maxLength={24}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
          placeholder="e.g. open.mind"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-neutral-400">Letters, numbers, dots and underscores, 3–24 characters.</p>
      </div>
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
          className={inputClass}
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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="birthDate" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Birth date
        </label>
        <input
          id="birthDate"
          type="date"
          required
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-neutral-400">You must be at least 13 years old to join.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-emerald-600">{notice}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {busy ? 'Joining…' : 'Join the club'}
      </button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md pt-12">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-12 w-12 text-neutral-900 dark:text-neutral-50" />
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Join the club.
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Pick a side. Make your case. Change your mind.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
      <p className="mt-4 text-center text-sm text-neutral-500">
        Already a member?{' '}
        <Link href="/login" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
