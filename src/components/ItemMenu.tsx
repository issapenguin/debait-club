'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TargetType } from '@/lib/types';

/**
 * The "..." menu on cases and comments.
 * Cases get Save / Share / Report; comments get Save / Report.
 */
export function ItemMenu({
  targetType,
  targetId,
  initialSaved,
  loggedIn,
  showShare = false,
  shareUrl,
  canDelete = false,
}: {
  targetType: TargetType;
  targetId: number;
  initialSaved: boolean;
  loggedIn: boolean;
  showShare?: boolean;
  shareUrl?: string;
  /** Show a Delete option (author-only actions call this). */
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [reporting, setReporting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reason, setReason] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [shareNote, setShareNote] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const requireLogin = () => {
    if (!loggedIn) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const toggleSave = async () => {
    if (!requireLogin()) return;
    setOpen(false);
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
    });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    if (res.ok) {
      const json = await res.json();
      setSaved(json.saved);
    }
  };

  const share = async () => {
    setOpen(false);
    const url = shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Debait Club', url });
        return;
      }
      throw new Error('no native share');
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareNote('Link copied');
      } catch {
        setShareNote('Copy this link: ' + url);
      }
      setTimeout(() => setShareNote(''), 2500);
    }
  };

  const submitReport = async () => {
    if (!requireLogin()) return;
    setReportState('sending');    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
    });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    setReportState(res.ok ? 'done' : 'error');
    if (res.ok) {
      setTimeout(() => {
        setOpen(false);
        setReporting(false);
        setReportState('idle');
        setReason('');
      }, 1500);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments?id=${targetId}`, { method: 'DELETE' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) return;
      setOpen(false);
      setConfirmingDelete(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setReporting(false);
          setConfirmingDelete(false);
          setReportState('idle');
        }}
        aria-label="More actions"
        aria-expanded={open}
        className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {shareNote && (
        <span className="absolute -top-8 right-0 whitespace-nowrap rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
          {shareNote}
        </span>
      )}
      {open && (
        <div className="absolute right-0 z-30 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {confirmingDelete ? (
            <div className="p-3">
              <p className="mb-1 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                Delete this comment?
              </p>
              <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                This can&apos;t be undone. Your comment will show as archived,
                and any replies to it will stay.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-full px-3 py-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doDelete}
                  disabled={deleting}
                  className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ) : !reporting ? (
            <div className="py-1">
              <button
                type="button"
                onClick={toggleSave}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                  <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                </svg>
                {saved ? 'Unsave' : 'Save'}
              </button>
              {showShare && (
                <button
                  type="button"
                  onClick={share}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                    <path d="M12 3v12m0-12L8 7m4-4l4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
                  </svg>
                  Share
                </button>
              )}
              <button
                type="button"
                onClick={() => setReporting(true)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                  <path d="M4 4h16v12H9l-5 4V4z" />
                </svg>
                Report
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          ) : (
            <div className="p-3">
              {reportState === 'done' ? (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Thanks — our moderators will take a look.
                </p>
              ) : (
                <>
                  <p className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    Why are you reporting this?
                  </p>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Briefly describe the issue"
                    className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                  {reportState === 'error' && (
                    <p className="mt-1 text-xs text-red-600">Something went wrong. Try again.</p>
                  )}
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReporting(false)}
                      className="rounded-full px-3 py-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={reportState === 'sending'}
                      className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      {reportState === 'sending' ? 'Sending…' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
