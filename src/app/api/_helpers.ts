// Shared helpers for API routes: auth + privileged writes.
import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { ensureProfileForUser } from '@/lib/data';

export interface AuthedContext {
  userId: string;
  service: NonNullable<ReturnType<typeof getServiceClient>>;
}

/** Verifies the request is authenticated; returns the user id + service client. */
export async function requireAuth(): Promise<
  { ctx: AuthedContext } | { response: NextResponse }
> {
  const supabase = await getServerClient();
  const service = getServiceClient();
  if (!supabase || !service) {
    return {
      response: NextResponse.json({ error: 'Backend is not configured.' }, { status: 503 }),
    };
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { response: NextResponse.json({ error: 'Log in to continue.' }, { status: 401 }) };
  }
  await ensureProfileForUser(data.user);
  return { ctx: { userId: data.user.id, service } };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
