import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { ensureProfileForUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

// OAuth callback: exchanges the code for a session, ensures a profile row
// exists for the new user, then sends them home.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const redirectTo = new URL(next, url.origin);

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL('/', url.origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await ensureProfileForUser(data.user);
      }
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(new URL('/login?error=oauth', url.origin));
}
