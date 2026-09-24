'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EditBio({ initialBio }: { initialBio: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1.5 text-xs font-medium text-neutral-400 underline-offset-2 transition hover:text-neutral-700 hover:underline dark:text-neutral-500 dark:hover:text-neutral-300"
      >
        Edit bio
      </button>
    );
  }

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? 'Could not save your bio.');
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 max-w-md">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        maxLength={300}
        autoFocus
        placeholder="Tell the club a little about yourself"
        className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setBio(initialBio);
            setError('');
          }}
          className="rounded-full px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {saving ? 'Saving…' : 'Save bio'}
        </button>
      </div>
    </div>
  );
}
