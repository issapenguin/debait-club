'use client';

import { useState, useTransition } from 'react';
import {
  lookupContent,
  updateContentBody,
  archiveContent,
  type AdminContentItem,
} from './actions';

export function ContentEditor() {
  const [type, setType] = useState<'case' | 'comment'>('case');
  const [idInput, setIdInput] = useState('');
  const [item, setItem] = useState<AdminContentItem | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    const id = parseInt(idInput, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setError('Enter a valid numeric ID.');
      return;
    }
    setError(null);
    setNotice(null);
    setItem(null);
    setEditing(false);
    startTransition(async () => {
      try {
        const found = await lookupContent(type, id);
        if (!found) {
          setError(`No ${type} found with ID ${id}.`);
          return;
        }
        setItem(found);
        setDraft(found.body);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lookup failed.');
      }
    });
  }

  function save() {
    if (!item) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await updateContentBody(item.type, item.id, draft);
        setItem({ ...item, body: draft.trim() });
        setEditing(false);
        setNotice('Saved.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed.');
      }
    });
  }

  function remove() {
    if (!item) return;
    if (
      !window.confirm(
        `Archive this ${item.type} #${item.id}? It will show as archived. This cannot be undone.`
      )
    )
      return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await archiveContent(item.type, item.id);
        setItem({ ...item, isDeleted: true });
        setNotice('Archived.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Archive failed.');
      }
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-full border border-neutral-300 dark:border-neutral-700">
          {(['case', 'comment'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1 text-xs font-semibold capitalize ${
                type === t
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          inputMode="numeric"
          placeholder={`${type} ID (e.g. 101281)`}
          className="w-44 rounded-full border border-neutral-300 bg-transparent px-3 py-1 text-sm text-neutral-800 placeholder:text-neutral-400 dark:border-neutral-700 dark:text-neutral-100"
        />
        <button
          type="button"
          onClick={load}
          disabled={pending}
          className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {pending ? 'Loading…' : 'Load'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && <p className="mt-3 text-sm text-green-700 dark:text-green-400">{notice}</p>}

      {item && (
        <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {item.type} #{item.id}
            </span>
            <span className="capitalize">{item.sideOrStance.replace(/_/g, ' ')}</span>
            <span>by @{item.authorUsername ?? 'deleted user'}</span>
            {item.isDeleted && (
              <span className="font-semibold text-amber-600 dark:text-amber-400">archived</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={pending || item.isDeleted}
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Edit text
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={save}
                    disabled={pending}
                    className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                  >
                    {pending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setDraft(item.body);
                    }}
                    disabled={pending}
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={remove}
                disabled={pending || item.isDeleted}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? 'Working…' : 'Archive'}
              </button>
            </div>
          </div>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              className="mt-3 w-full rounded-xl border border-neutral-300 bg-transparent p-3 text-sm leading-relaxed text-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
            />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
              {item.body}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
