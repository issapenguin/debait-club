'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/champions', label: 'Champions' },
  { href: '/archive', label: 'Archive' },
  { href: '/rules', label: 'Rules' },
  { href: '/submit', label: 'Got a topic?' },
  { href: '/history', label: 'History' },
];

interface SessionInfo {
  username: string | null;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setSession(null);
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();
        setSession({ username: (profile as { username?: string } | null)?.username ?? null });
      }
      setLoaded(true);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = getBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 text-neutral-900 dark:text-neutral-50" aria-label="Debait Club home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-semibold lowercase tracking-tight">
            debait club
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 sm:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {loaded && session ? (
            <>
              {session.username ? (
                <Link
                  href={`/profile/${session.username}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white hover:bg-sky-700"
                  title="Your profile"
                  aria-label="Your profile"
                >
                  {session.username.charAt(0).toUpperCase()}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={signOut}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Log out
              </button>
            </>
          ) : loaded ? (
            <Link
              href="/login"
              className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Log in
            </Link>
          ) : null}
        </div>
      </div>
      {/* mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-neutral-100 px-4 py-1.5 sm:hidden dark:border-neutral-900" aria-label="Primary mobile">
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${
                active
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
