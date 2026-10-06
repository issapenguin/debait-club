import { TrophyIcon } from './TrophyIcon';

export type ChampionBadgeTier = 'gold' | 'silver' | 'bronze' | 'debaiter';

const TOOLTIPS: Record<ChampionBadgeTier, string> = {
  gold: 'Master Debaiter — holds the #1 spot on the Champions board',
  silver: 'Debait Champion — holds the #2 spot on the Champions board',
  bronze: 'Debait Champion — holds the #3 spot on the Champions board',
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

const PILL_STYLES: Record<ChampionBadgeTier, string> = {
  gold: 'bg-[#d4af37] text-neutral-900',
  silver: 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
  bronze: 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
  debaiter:
    'border border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400',
};

const PILL_TEXT: Record<ChampionBadgeTier, string> = {
  gold: 'Master Debaiter',
  silver: 'Debait Champion',
  bronze: 'Debait Champion',
  debaiter: 'Top Debaiter',
};

/** Title pill: Master Debaiter (#1), Debait Champion (#2-3), Top Debaiter (top 50). */
export function ChampionPill({ tier }: { tier: ChampionBadgeTier }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${PILL_STYLES[tier]}`}
      title={TOOLTIPS[tier]}
    >
      {PILL_TEXT[tier]}
    </span>
  );
}

/** Backwards-compatible alias. */
export function TopDebaiterPill() {
  return <ChampionPill tier="debaiter" />;
}

/**
 * Champion badge shown next to a username wherever they post, and on their
 * profile. The current top 3 get a metallic trophy plus their title pill
 * (Master Debaiter for #1, Debait Champion for #2-3); everyone else on the
 * board (top 50) gets the Top Debaiter pill. Badges track the current
 * board, so they move as the standings change.
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
  if (tier === 'debaiter') return <ChampionPill tier="debaiter" />;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <span
        className="inline-flex shrink-0 items-center"
        title={TOOLTIPS[tier]}
        aria-label={TOOLTIPS[tier]}
        role="img"
      >
        <TrophyIcon tone={tier} className={`${className} drop-shadow-sm`} />
      </span>
      <ChampionPill tier={tier} />
    </span>
  );
}

/** One-line explanation of a badge tier, used on profile pages. */
export function championBadgeLabel(badge: string | null | undefined): string | null {
  const tier = normalize(badge);
  if (!tier) return null;
  if (tier === 'gold') return 'Master Debaiter · holds the #1 spot';
  if (tier === 'silver') return 'Debait Champion · holds the #2 spot';
  if (tier === 'bronze') return 'Debait Champion · holds the #3 spot';
  return 'Top Debaiter · in the top 50';
}
