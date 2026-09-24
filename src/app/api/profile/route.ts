import { NextResponse } from 'next/server';
import { requireAuth, badRequest } from '../_helpers';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

// PUT /api/profile { bio?, avatar_url? } — the signed-in user updates their own profile.
export async function PUT(request: Request) {
  const authed = await requireAuth();
  if ('response' in authed) return authed.response;
  const { userId, service } = authed.ctx;

  const body = await request.json().catch(() => ({}));
  const updates: { bio?: string | null; avatar_url?: string | null } = {};

  if ('bio' in body) {
    const { bio } = body as { bio?: unknown };
    if (bio !== null && typeof bio !== 'string') return badRequest('Invalid bio.');
    updates.bio = typeof bio === 'string' ? bio.trim().slice(0, 300) : null;
  }

  if ('avatar_url' in body) {
    const { avatar_url } = body as { avatar_url?: unknown };
    if (avatar_url !== null) {
      if (typeof avatar_url !== 'string') return badRequest('Invalid picture.');
      // Must be this user's own file in the public avatars bucket — no
      // arbitrary URLs, no path traversal.
      const expectedPrefix = `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/`;
      const cleanUrl = avatar_url.split('?')[0];
      if (
        !SUPABASE_URL ||
        !avatar_url.startsWith(expectedPrefix) ||
        cleanUrl.includes('..') ||
        !/\.(jpg|jpeg|png|webp)$/i.test(cleanUrl)
      ) {
        return badRequest('Invalid picture.');
      }
      updates.avatar_url = avatar_url;
    } else {
      updates.avatar_url = null;
    }
  }

  if (Object.keys(updates).length === 0) return badRequest('Nothing to update.');

  const { error } = await service.from('profiles').update(updates).eq('id', userId);
  if (error) {
    return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...updates });
}
