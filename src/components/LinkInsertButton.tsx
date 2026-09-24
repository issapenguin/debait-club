'use client';

import { useEffect, useRef, useState } from 'react';

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Toolbar button that turns highlighted text into a link, Google-Sheets style:
 * highlight text in the attached textarea, click the link icon, paste a URL,
 * and the selection becomes [text](url). With no selection, the URL is
 * inserted as its own link at the cursor.
 */
export function LinkInsertButton({
  textareaRef,
  getValue,
  setValue,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  getValue: () => string;
  setValue: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  const openPicker = () => {
    const el = textareaRef.current;
    if (!el) return;
    setSelection([el.selectionStart ?? 0, el.selectionEnd ?? 0]);
    setUrl('');
    setUrlError('');
    setOpen(true);
  };

  const apply = () => {
    const href = normalizeUrl(url);
    if (!href) {
      setUrlError('Enter a valid http or https URL.');
      return;
    }
    const el = textareaRef.current;
    const value = getValue();
    const [start, end] = selection ?? [el?.selectionStart ?? value.length, el?.selectionEnd ?? value.length];
    const selected = value.slice(start, end);
    const markup = selected ? `[${selected}](${href})` : `[${href}](${href})`;
    const next = value.slice(0, start) + markup + value.slice(end);
    setValue(next);
    setOpen(false);
    // Restore focus and park the caret after the inserted link.
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const caret = start + markup.length;
      ta.setSelectionRange(caret, caret);
    });
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={openPicker}
        title="Add link"
        aria-label="Add link"
        className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-sky-600 dark:hover:bg-neutral-800 dark:hover:text-sky-400"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <label
            htmlFor="link-url-input"
            className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400"
          >
            Link URL
          </label>
          <input
            ref={inputRef}
            id="link-url-input"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply();
              }
            }}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-neutral-200 bg-transparent px-2.5 py-1.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-sky-500 dark:border-neutral-700 dark:text-neutral-100"
          />
          {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-700"
            >
              Add link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
