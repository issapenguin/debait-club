import Link from 'next/link';
import { fetchChampions } from '@/lib/data';
import { CoinIcon } from '@/components/CoinIcon';
import { Avatar } from '@/components/Avatar';

export const dynamic = 'force-dynamic';

const MEDALS = ['#d4af37', '#9aa0a6', '#b0793c'];

export default async function ChampionsPage() {
  const champions = await fetchChampions(50);

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Champions
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Ranked by total d-coins — the sum of upvotes earned across every case,
        comment, and topic submission a member has posted. Make strong cases,
        change minds, climb the board.
      </p>

      {champions.length === 0 ? (
        <p className="mt-10 text-center text-sm italic text-neutral-400">
          No champions yet. Post a case and take the crown.
        </p>
      ) : (
        <ol className="mt-8 space-y-2">
          {champions.map((c, i) => (
            <li
              key={c.username}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={
                  i < 3
                    ? { backgroundColor: MEDALS[i], color: '#fff' }
                    : undefined
                }
              >
                {i < 3 ? (
                  <span className="text-white">{i + 1}</span>
                ) : (
                  <span className="text-neutral-500 dark:text-neutral-400">{i + 1}</span>
                )}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/profile/${c.username}`}
                  className="flex items-center gap-2 font-semibold text-neutral-900 hover:text-sky-600 dark:text-neutral-50 dark:hover:text-sky-400"
                >
                  <Avatar url={c.avatar_url} username={c.username} className="h-7 w-7 text-xs" />
                  {c.display_name ?? `@${c.username}`}
                </Link>
                <p className="truncate text-sm text-neutral-500">@{c.username}</p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 text-right">
                <CoinIcon className="h-5 w-5" />
                <span className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {c.points.toLocaleString()}
                </span>{' '}
                <span className="text-sm text-neutral-400">d-coins</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
