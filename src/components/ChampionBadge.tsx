import { TrophyIcon } from './TrophyIcon';

export type ChampionBadgeTier = 'gold' | 'silver' | 'bronze' | 'debaiter';

const TOOLTIPS: Record<ChampionBadgeTier, string> = {
  gold: 'Gold Champion — holds the #1 spot on the Champions board',
  silver: 'Silver Champion — holds the #2 spot on the Champions board',
  bronze: 'Bronze Champion — holds the #3 spot on the Champions board',
  debaiter: 'Top Debaiter — in the top 50 on the Champions board',
};

function normalize(badge: string | null | undefined): ChampionBadgeTier | null {
  // 'champion' is the legacy top-100 badge; it now renders as Top Debaiter.
  if (badge === 'champion') return 'debaiter';
  return badge === 'gold' ||
    badge === 'silver' ||
    badge === 'bronze' ||
    badge === 'debaiter'
    ? badge
    : null;
}

/** The "Top Debaiter" pill for everyone on the board outside the top 3. */
export function TopDebaiterPill() {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white dark:bg-neutral-100 dark:text-neutral-900"
      title={TOOLTIPS.debaiter}
    >
      Top Debaiter
    </span>
  );
}

/**
 * Champion badge shown next to a username wherever they post, and on their
 * profile. The current top 3 get a metallic trophy by rank; everyone else
 * on the board (top 50) gets the Top Debaiter pill. Badges track the
 * current board, so they can move up or down as the standings change.
 */
export function ChampionBadge({
  badge,
  className = 'h-4 w-4',
}: {
  badge: string | null | undefined;
  className?: string;
}) {
  const tier = normalize(badge);
  if (!tier) return null;
  if (tier === 'debaiter') return <TopDebaiterPill />;
  return (
    <span
      className="inline-flex shrink-0 items-center"
      title={TOOLTIPS[tier]}
      aria-label={TOOLTIPS[tier]}
      role="img"
    >
      <TrophyIcon tone={tier} className={`${className} drop-shadow-sm`} />
    </span>
  );
}

/** One-line explanation of a badge tier, used on profile pages. */
export function championBadgeLabel(badge: string | null | undefined): string | null {
  const tier = normalize(badge);
  if (!tier) return null;
  if (tier === 'gold') return 'Gold Champion · holds the #1 spot';
  if (tier === 'silver') return 'Silver Champion · holds the #2 spot';
  if (tier === 'bronze') return 'Bronze Champion · holds the #3 spot';
  return 'Top Debaiter · in the top 50';
}
