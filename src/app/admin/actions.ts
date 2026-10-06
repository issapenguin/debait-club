'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient, getSessionUser } from '@/lib/supabase/server';

/** Throws unless the signed-in user has a row in admin_users. */
async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not signed in.');
  const supabase = await getServerClient();
  if (!supabase) throw new Error('Server not configured.');
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) throw new Error('Not authorized.');
  const service = getServiceClient();
  if (!service) throw new Error('Server not configured.');
  return service;
}

/** Mark an open report as dismissed (content stays up). */
export async function dismissReport(reportId: number) {
  const service = await requireAdmin();
  const { error } = await service
    .from('reports')
    .update({ status: 'dismissed' })
    .eq('id', reportId)
    .eq('status', 'open');
  if (error) throw new Error('Could not dismiss the report.');
  revalidatePath('/admin');
}

/**
 * Archive the reported case or comment and mark the report actioned.
 * Soft delete: the row stays (votes, replies, and saved references intact)
 * so threads stay whole and lifetime d-coin tallies are preserved.
 */
export async function removeReportedContent(reportId: number) {
  const service = await requireAdmin();
  const { data: report, error: fetchError } = await service
    .from('reports')
    .select('id, target_type, target_id, status')
    .eq('id', reportId)
    .maybeSingle();
  if (fetchError || !report) throw new Error('Report not found.');
  if (report.status !== 'open') throw new Error('Report already handled.');

  const targetType = report.target_type as 'case' | 'comment';
  const targetId = report.target_id as number;
  const table = targetType === 'case' ? 'cases' : 'comments';

  const { error: archiveError } = await service
    .from(table)
    .update({ is_deleted: true })
    .eq('id', targetId);
  if (archiveError) throw new Error('Could not remove the content.');

  await service.from('reports').update({ status: 'actioned' }).eq('id', reportId);
  revalidatePath('/admin');
}

export interface AdminContentItem {
  id: number;
  type: 'case' | 'comment';
  body: string;
  sideOrStance: string;
  authorUsername: string | null;
  isDeleted: boolean;
  createdAt: string;
}

/** Look up any case or comment by ID for admin editing. */
export async function lookupContent(
  type: 'case' | 'comment',
  id: number
): Promise<AdminContentItem | null> {
  const service = await requireAdmin();
  const table = type === 'case' ? 'cases' : 'comments';
  const { data, error } = await service
    .from(table)
    .select('id, body, is_deleted, created_at, author:profiles(username)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as {
    id: number;
    body: string;
    is_deleted: boolean;
    created_at: string;
    author: { username: string } | { username: string }[] | null;
  };
  // Fetch side/stance separately since column name differs by table.
  const { data: extra } = await service
    .from(table)
    .select(type === 'case' ? 'side' : 'stance')
    .eq('id', id)
    .maybeSingle();
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    type,
    body: row.body,
    sideOrStance: (extra as { side?: string; stance?: string } | null)?.side ??
      (extra as { side?: string; stance?: string } | null)?.stance ?? '',
    authorUsername: author?.username ?? null,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
  };
}

/** Update the body text of any case or comment (admin only). */
export async function updateContentBody(
  type: 'case' | 'comment',
  id: number,
  body: string
): Promise<void> {
  const service = await requireAdmin();
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Body cannot be empty.');
  if (trimmed.length > 10000) throw new Error('Body is too long.');
  const table = type === 'case' ? 'cases' : 'comments';
  const { error } = await service.from(table).update({ body: trimmed }).eq('id', id);
  if (error) throw new Error('Could not update the content.');
  revalidatePath('/admin');
}

/** Archive any case or comment directly (admin only, no report needed). */
export async function archiveContent(
  type: 'case' | 'comment',
  id: number
): Promise<void> {
  const service = await requireAdmin();
  const table = type === 'case' ? 'cases' : 'comments';
  const { error } = await service.from(table).update({ is_deleted: true }).eq('id', id);
  if (error) throw new Error('Could not archive the content.');
  revalidatePath('/admin');
}
