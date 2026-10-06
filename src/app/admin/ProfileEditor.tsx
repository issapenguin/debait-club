'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchProfiles, updateProfile, type AdminProfile } from './actions';

export function ProfileEditor({ profiles }: { profiles: AdminProfile[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminProfile[]>([]);
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Clicking a user in the "Editable users" list links here with ?user=<id>;
  // load that profile into the editor and scroll it into view.
  useEffect(() => {
    const id = searchParams.get('user');
    if (!id) return;
    const p = profiles.find((x) => x.id === id);
    if (p) {
      setSelected(p);
      setUsername(p.username);
      setDisplayName(p.displayName ?? '');
      setError(null);
      setNotice(null);
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function search() {
    if (query.trim().length < 2) {
      setError('Type at least 2 characters to search.');
      return;
    }
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const found = await searchProfiles(query);
        setResults(found);
        if (found.length === 0) setError('No profiles match that search.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed.');
      }
    });
  }

  function pick(p: AdminProfile) {
    setSelected(p);
    setUsername(p.username);
    setDisplayName(p.displayName ?? '');
    setError(null);
    setNotice(null);
  }

  function save() {
    if (!selected) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await updateProfile(selected.id, username, displayName);
        const updated = {
          ...selected,
          username: username.trim().toLowerCase(),
          displayName: displayName.trim(),
        };
        setSelected(updated);
        setResults((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
        setNotice('Saved.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed.');
      }
    });
  }

  const inputClass =
    'rounded-full border border-neutral-300 bg-transparent px-3 py-1 text-sm text-neutral-800 placeholder:text-neutral-400 dark:border-neutral-700 dark:text-neutral-100';

  return (
    <div
      ref={rootRef}
      className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search username or display name"
          className={`${inputClass} w-64`}
        />
        <button
          type="button"
          onClick={search}
          disabled={pending}
          className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {pending ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && <p className="mt-3 text-sm text-green-700 dark:text-green-400">{notice}</p>}

      {results.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                selected?.id === p.id
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                  : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {p.displayName ?? p.username} @{p.username}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Username
              </span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))
                }
                className={`${inputClass} w-52`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Display name
              </span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`${inputClass} w-52`}
              />
            </label>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Usernames: 3-24 chars, lowercase letters, numbers, dots, underscores. Renames show
            everywhere instantly.
          </p>
        </div>
      )}
    </div>
  );
}
