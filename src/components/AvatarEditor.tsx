'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import { Avatar } from './Avatar';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
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

export function AvatarEditor({
  userId,
  username,
  initialUrl,
}: {
  userId: string;
  username: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);

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
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.');
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
      const img = await loadImage(file);
      const blob = await renderSquare(img);
      const path = `${userId}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw new Error('Upload failed — please try again.');
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      await saveUrl(publicUrl);
      setUrl(publicUrl);
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
      await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
      await saveUrl(null);
      setUrl(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="relative shrink-0 rounded-full transition hover:opacity-90 disabled:opacity-60"
        title={url ? 'Change your picture' : 'Add a profile picture'}
        aria-label={url ? 'Change your profile picture' : 'Add a profile picture'}
      >
        <Avatar url={url} username={username} className="h-16 w-16 text-2xl" />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-600 transition hover:border-neutral-500 hover:text-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
          >
            {busy ? 'Uploading…' : url ? 'Change picture' : 'Add picture'}
          </button>
          {url && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-full px-3 py-1 text-sm text-neutral-500 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowRules((s) => !s)}
            className="text-sm text-sky-600 hover:underline dark:text-sky-400"
          >
            {showRules ? 'Hide' : 'Picture rules'}
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {showRules && (
          <ul className="mt-2 max-w-md list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            <li>JPG, PNG, or WebP only, max 2 MB. Your picture is cropped to a square automatically.</li>
            <li>Your picture is public — everyone in the club can see it.</li>
            <li>Only you can change or remove it; it lives in your private folder.</li>
            <li>House Rules apply: no offensive, hateful, or explicit imagery. Offending pictures are removed.</li>
          </ul>
        )}
      </div>
    </div>
  );
}
