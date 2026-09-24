import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, isServiceConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

const USERNAME_RE = /^[a-z0-9._]{3,24}$/;

function ageOn(birthDate: string): number | null {
  const d = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// POST /api/auth/signup — server-validated signup (blocks under-13s).
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isServiceConfigured()) {
    return NextResponse.json({ error: 'Sign-up is not configured yet.' }, { status: 503 });
  }

  const { display_name, username, email, password, birth_date } = await request
    .json()
    .catch(() => ({}));

  if (!display_name || typeof display_name !== 'string' || display_name.trim().length === 0) {
    return NextResponse.json({ error: 'Please enter a display name.' }, { status: 400 });
  }
  const cleanUsername = typeof username === 'string' ? username.toLowerCase().trim() : '';
  if (!USERNAME_RE.test(cleanUsername)) {
    return NextResponse.json(
      { error: 'Username must be 3–24 characters: letters, numbers, dots, underscores.' },
      { status: 400 }
    );
  }
  const cleanDisplay = display_name.trim().slice(0, 80);
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  const age = typeof birth_date === 'string' ? ageOn(birth_date) : null;
  if (age === null) {
    return NextResponse.json({ error: 'Please enter a valid birth date.' }, { status: 400 });
  }
  if (age < 13) {
    return NextResponse.json(
      { error: 'You must be at least 13 years old to join Debait Club.' },
      { status: 400 }
    );
  }

  const service = getServiceClient()!;
  const { data: taken } = await service
    .from('profiles')
    .select('id')
    .eq('username', cleanUsername)
    .maybeSingle();
  if (taken) {
    return NextResponse.json({ error: 'That username is taken. Try another.' }, { status: 400 });
  }

  const supabase = (await getServerClient())!;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: cleanUsername, display_name: cleanDisplay } },
  });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'Sign-up failed.' }, { status: 400 });
  }

  // Create the profile row now (service role bypasses RLS for this write).
  const { error: profileError } = await service.from('profiles').insert({
    id: data.user.id,
    username: cleanUsername,
    display_name: cleanDisplay,
  });
  if (profileError) {
    // Auth user exists but profile insert failed (e.g. race) — surface clearly.
    return NextResponse.json(
      { error: 'Account created but profile setup failed. Please log in and try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, confirmed: !!data.session });
}
