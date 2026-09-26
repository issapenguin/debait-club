'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import { Avatar } from './Avatar';

const BASE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const GIF_TYPE = 'image/gif';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const AVATAR_PX = 512;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

/** Center-crop to a square and downscale — the stored bytes are re-rendered
 *  pixels, never the raw upload. */
function renderSquare(img: HTMLImageElement): Promise<Blob> {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_PX;
  canvas.height = AVATAR_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process that image.');
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_PX, AVATAR_PX);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image.'))),
      'image/jpeg',
      0.85
    )
  );
}

const PICTURE_RULES = [
  'JPG, PNG, or WebP only, max 2 MB. Your picture is cropped to a square automatically.',
  'Your picture is public — everyone in the club can see it.',
  'House Rules apply: no offensive, hateful, or explicit imagery. Offending pictures are removed.',
];

export function AvatarEditor({
  userId,
  username,
  initialUrl,
  canUseGif = false,
}: {
  userId: string;
  username: string;
  initialUrl: string | null;
  /** Founder-only: animated GIF avatars. Nobody else is offered or allowed one. */
  canUseGif?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);

  const acceptedTypes = canUseGif ? [...BASE_ACCEPTED_TYPES, GIF_TYPE] : BASE_ACCEPTED_TYPES;
  const pictureRules = canUseGif
    ? [
        'JPG, PNG, WebP, or GIF (animated) only, max 2 MB. Still pictures are cropped to a square automatically; GIFs are kept as-is.',
        'Your picture is public — everyone in the club can see it.',
        'House Rules apply: no offensive, hateful, or explicit imagery. Offending pictures are removed.',
      ]
    : PICTURE_RULES;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setShowRules(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open ]);

  const saveUrl = async (avatarUrl: string | null) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
    if (!res.ok) throw new Error('Could not save your picture.');
  };

  const onPick = async (file: File | undefined) => {
    setError('');
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) {
      setError(
        canUseGif ? 'Please choose a JPG, PNG, WebP, or GIF image.' : 'Please choose a JPG, PNG, or WebP image.'
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That image is over 2 MB — please pick a smaller one.');
      return;
    }
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      if (!supabase) throw new Error('Could not reach the server.');
      // GIFs are uploaded untouched so the animation survives; everything
      // else is center-cropped and re-rendered as a JPEG.
      const isGif = canUseGif && file.type === GIF_TYPE;
      const blob = isGif ? file : await renderSquare(await loadImage(file));
      const path = `${userId}/${isGif ? 'avatar.gif' : 'avatar.jpg'}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: isGif ? GIF_TYPE : 'image/jpeg', upsert: true });
      if (upErr) throw new Error('Upload failed — please try again.');
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      await saveUrl(publicUrl);
      setUrl(publicUrl);
      setOpen(false);
      setShowRules(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    setError('');
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      if (!supabase) throw new Error('Could not reach the server.');
      await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.gif`]);
      await saveUrl(null);
      setUrl(null);
      setShowRules(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError('');
          setOpen(true);
        }}
        className="relative shrink-0 rounded-full transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        title={url ? 'Profile picture options' : 'Add a profile picture'}
        aria-label={url ? 'Open profile picture options' : 'Add a profile picture'}
      >
        <Avatar url={url} username={username} className="h-20 w-20 text-3xl" />
        {!url && (
          <span
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setOpen(false);
              setShowRules(false);
            }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Profile picture options"
            className="relative w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="flex justify-center">
              <Avatar url={url} username={username} className="h-24 w-24 text-4xl" />
            </div>
            <h2 className="mt-3 text-center font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Profile picture
            </h2>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                {busy ? 'Uploading…' : url ? 'Change picture' : 'Add picture'}
              </button>
              {url && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-red-400 hover:text-red-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-red-500 dark:hover:text-red-400"
                >
                  Remove picture
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRules((s) => !s)}
                className="rounded-full px-4 py-2 text-sm text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50"
              >
                {showRules ? 'Hide picture rules' : 'Picture rules'}
              </button>
            </div>

            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

            {showRules && (
              <ul className="mt-3 list-disc space-y-1 rounded-2xl bg-neutral-50 p-4 pl-9 text-[13px] leading-relaxed text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
                {pictureRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowRules(false);
              }}
              className="mt-4 w-full rounded-full px-4 py-2 text-sm text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={canUseGif ? 'image/jpeg,image/png,image/webp,image/gif' : 'image/jpeg,image/png,image/webp'}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </>
  );
}
