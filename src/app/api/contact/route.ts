import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { badRequest } from '../_helpers';
import { moderate } from '@/lib/moderation';
import { sendEmail, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Server-side recipient. Your address never appears in client code.
const CONTACT_TO = process.env.CONTACT_TO_EMAIL ?? 'rxmehra@gmail.com';

// POST /api/contact { subject, message, email? }
// Logged-in users send as themselves (identity taken from the session).
// Logged-out users must supply an email so we can reply.
export async function POST(request: Request) {
  const service = getServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Backend is not configured.' }, { status: 503 });
  }

  const { subject, message, email } = await request.json().catch(() => ({}));
  const cleanSubject = typeof subject === 'string' ? subject.trim().slice(0, 140) : '';
  const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 4000) : '';
  if (!cleanSubject) return badRequest('Please add a subject.');
  if (!cleanMessage) return badRequest('Please write a message.');

  const mod = moderate(`${cleanSubject}\n${cleanMessage}`);
  if (!mod.ok) return badRequest(mod.reason ?? 'That message cannot be sent.');

  // Identify the sender from the session; never trust a client-supplied identity.
  let userId: string | null = null;
  let senderEmail = '';
  let displayName: string | null = null;
  let username: string | null = null;
  const supabase = await getServerClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (userData.user) {
    userId = userData.user.id;
    senderEmail = userData.user.email ?? '';
    const { data: profile } = await service
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .maybeSingle();
    displayName = (profile as { display_name: string | null } | null)?.display_name ?? null;
    username = (profile as { username: string } | null)?.username ?? null;
  } else {
    const cleanEmail =
      typeof email === 'string' ? email.trim().toLowerCase().slice(0, 200) : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return badRequest('Please add a valid email so we can reply.');
    }
    senderEmail = cleanEmail;
  }

  // Light spam throttle: one message per minute per sender.
  const since = new Date(Date.now() - 60_000).toISOString();
  let recentQuery = service
    .from('contact_messages')
    .select('id', { head: true, count: 'exact' })
    .gte('created_at', since);
  recentQuery = userId ? recentQuery.eq('user_id', userId) : recentQuery.eq('email', senderEmail);
  const { count: recent } = await recentQuery;
  if ((recent ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Please wait a minute before sending another message.' },
      { status: 429 }
    );
  }

  // Store first; email forwarding is best-effort on top.
  const { data: inserted, error } = await service
    .from('contact_messages')
    .insert({
      user_id: userId,
      email: senderEmail,
      display_name: displayName,
      username,
      subject: cleanSubject,
      message: cleanMessage,
    })
    .select('id')
    .single();
  if (error || !inserted) {
    console.error('contact_messages insert failed', error);
    return NextResponse.json(
      { error: 'Could not send your message. Please try again.' },
      { status: 500 }
    );
  }

  if (isEmailConfigured()) {
    const who = username
      ? `${displayName ?? username} (@${username}) <${senderEmail}>`
      : senderEmail;
    const sent = await sendEmail({
      to: CONTACT_TO,
      subject: `[Debait Club contact] ${cleanSubject}`,
      text: `From: ${who}\n\n${cleanMessage}`,
      replyTo: senderEmail,
    });
    if (sent) {
      await service
        .from('contact_messages')
        .update({ email_sent: true })
        .eq('id', (inserted as { id: number }).id);
    }
  }

  return NextResponse.json({ ok: true });
}
