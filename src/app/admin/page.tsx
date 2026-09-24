import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerClient, getServiceClient, getSessionUser } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/format';
import { ReportActions } from './ReportActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — Debait Club',
  robots: { index: false, follow: false },
};

interface AuthUserLite {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');

  const supabase = await getServerClient();
  const { data: adminRow } = await supabase!
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminRow) notFound();

  const service = getServiceClient();
  if (!service) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-neutral-500">Server is not configured.</p>
      </div>
    );
  }

  async function count(table: string, match?: Record<string, string>) {
    let q = service!.from(table).select('id', { count: 'exact', head: true });
    if (match) {
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
    }
    const { count: n } = await q;
    return n ?? 0;
  }

  const [userCount, caseCount, commentCount, voteCount, submissionCount, openReportCount, messageCount] =
    await Promise.all([
      count('profiles'),
      count('cases'),
      count('comments'),
      count('votes'),
      count('topic_submissions'),
      count('reports', { status: 'open' }),
      count('contact_messages'),
    ]);

  // Recent signups, enriched with email + confirmation status from Auth.
  const { data: recentProfiles } = await service
    .from('profiles')
    .select('id, username, display_name, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  const { data: authList } = await service.auth.admin.listUsers({ perPage: 100 });
  const authById = new Map<string, AuthUserLite>(
    ((authList?.users ?? []) as AuthUserLite[]).map((u) => [u.id, u])
  );

  // Open report queue with target excerpts.
  const { data: reports } = await service
    .from('reports')
    .select('id, target_type, target_id, reason, created_at, reporter:profiles(username, display_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50);
  const reportList = (reports ?? []) as unknown as {
    id: number;
    target_type: 'case' | 'comment';
    target_id: number;
    reason: string | null;
    created_at: string;
    reporter: { username: string; display_name: string | null } | { username: string; display_name: string | null }[] | null;
  }[];
  const reporterOf = (r: (typeof reportList)[number]) =>
    Array.isArray(r.reporter) ? (r.reporter[0] ?? null) : r.reporter;

  const caseIds = [...new Set(reportList.filter((r) => r.target_type === 'case').map((r) => r.target_id))];
  const commentIds = [
    ...new Set(reportList.filter((r) => r.target_type === 'comment').map((r) => r.target_id)),
  ];
  const caseMap = new Map<number, { body: string; side: string; author: { username: string } | null }>();
  const commentMap = new Map<
    number,
    { body: string; stance: string; case_id: number; author: { username: string } | null }
  >();
  const first = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;
  if (caseIds.length > 0) {
    const { data } = await service
      .from('cases')
      .select('id, body, side, author:profiles(username)')
      .in('id', caseIds);
    for (const c of (data ?? []) as unknown as {
      id: number;
      body: string;
      side: string;
      author: { username: string } | { username: string }[] | null;
    }[]) {
      caseMap.set(c.id, { body: c.body, side: c.side, author: first(c.author) });
    }
  }
  if (commentIds.length > 0) {
    const { data } = await service
      .from('comments')
      .select('id, body, stance, case_id, author:profiles(username)')
      .in('id', commentIds);
    for (const c of (data ?? []) as unknown as {
      id: number;
      body: string;
      stance: string;
      case_id: number;
      author: { username: string } | { username: string }[] | null;
    }[]) {
      commentMap.set(c.id, { body: c.body, stance: c.stance, case_id: c.case_id, author: first(c.author) });
    }
  }

  // Recent contact-form messages.
  const { data: contactMessages } = await service
    .from('contact_messages')
    .select('id, email, display_name, username, subject, message, email_sent, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  const messageList = (contactMessages ?? []) as {
    id: number;
    email: string;
    display_name: string | null;
    username: string | null;
    subject: string;
    message: string;
    email_sent: boolean;
    created_at: string;
  }[];

  const stats: [string, number][] = [
    ['Users', userCount],
    ['Cases', caseCount],
    ['Comments', commentCount],
    ['D-coin votes', voteCount],
    ['Topic submissions', submissionCount],
    ['Open reports', openReportCount],
    ['Messages', messageCount],
  ];

  return (
    <div className="mx-auto max-w-4xl pt-10 pb-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Admin
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Private. Only visible to your account.
      </p>

      <section className="mt-8" aria-label="Overview">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(([label, n]) => (
            <div
              key={label}
              className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                {n.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-label="Report queue">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Report queue
        </h2>
        {reportList.length === 0 ? (
          <p className="text-sm italic text-neutral-400">No open reports. All quiet.</p>
        ) : (
          <div className="space-y-3">
            {reportList.map((r) => {
              const target =
                r.target_type === 'case' ? caseMap.get(r.target_id) : commentMap.get(r.target_id);
              const caseId = r.target_type === 'case' ? r.target_id : commentMap.get(r.target_id)?.case_id;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      {r.target_type} #{r.target_id}
                    </span>
                    <span>
                      reported by{' '}
                      <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                        @{reporterOf(r)?.username ?? 'unknown'}
                      </span>
                    </span>
                    <span>{timeAgo(r.created_at)}</span>
                    <div className="ml-auto">
                      <ReportActions reportId={r.id} />
                    </div>
                  </div>
                  {r.reason && (
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <span className="font-semibold">Reason:</span> {r.reason}
                    </p>
                  )}
                  <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200">
                    {target ? (
                      <>
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                          {r.target_type === 'case'
                            ? ` ${(target as { side: string }).side} case`
                            : ` ${(target as { stance: string }).stance.replace(/_/g, ' ')} comment`}{' '}
                          by @{(target.author?.username ?? 'deleted user')}
                        </span>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                          {target.body.length > 280 ? `${target.body.slice(0, 280)}…` : target.body}
                        </p>
                        {caseId && (
                          <Link
                            href={`/case/${caseId}`}
                            className="mt-2 inline-block text-xs font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
                          >
                            View in context
                          </Link>
                        )}
                      </>
                    ) : (
                      <span className="italic text-neutral-400">
                        Content already removed.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10" aria-label="Contact messages">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Contact messages
        </h2>
        {messageList.length === 0 ? (
          <p className="text-sm italic text-neutral-400">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {messageList.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                    {m.display_name ?? m.username ?? 'Anonymous'}
                    {m.username ? ` @${m.username}` : ''}
                  </span>
                  <span>{m.email}</span>
                  <span>{timeAgo(m.created_at)}</span>
                  <span
                    className={
                      m.email_sent
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {m.email_sent ? 'emailed' : 'stored only'}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {m.subject}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {m.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10" aria-label="Recent signups">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Recent signups
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[560px] bg-white text-left text-sm dark:bg-neutral-900">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                <th className="px-4 py-2 font-semibold">User</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Confirmed</th>
                <th className="px-4 py-2 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(recentProfiles ?? []).map((p: { id: string; username: string; display_name: string | null; created_at: string }) => {
                const a = authById.get(p.id);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {p.display_name ?? p.username}
                      </span>{' '}
                      <span className="text-neutral-400">@{p.username}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-300">
                      {a?.email ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      {a?.email_confirmed_at ? (
                        <span className="text-green-700 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                      {timeAgo(p.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
