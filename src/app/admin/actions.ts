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
