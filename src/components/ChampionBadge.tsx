import { TrophyIcon } from './TrophyIcon';

export type ChampionBadgeTier = 'gold' | 'silver' | 'bronze' | 'champion';

const TOOLTIPS: Record<ChampionBadgeTier, string> = {
  gold: 'Gold Champion — has held the #1 spot on the Champions board',
  silver: 'Silver Champion — has held the #2 spot on the Champions board',
  bronze: 'Bronze Champion — has held the #3 spot on the Champions board',
  champion: 'Champion — has reached the top 100 on the Champions board',
};

function normalize(badge: string | null | undefined): ChampionBadgeTier | null {
  return badge === 'gold' ||
    badge === 'silver' ||
    badge === 'bronze' ||
    badge === 'champion'
    ? badge
    : null;
}

/**
 * Champion badge shown next to a username wherever they post, and on their
 * profile. Top-three finishers get a metallic trophy; anyone else who has
 * reached the top 100 gets a smaller, muted trophy.
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
  const tone = tier === 'champion' ? 'muted' : tier;
  const size = tier === 'champion' ? 'h-3.5 w-3.5 opacity-80' : className;
  return (
    <span
      className="inline-flex shrink-0 items-center"
      title={TOOLTIPS[tier]}
      aria-label={TOOLTIPS[tier]}
      role="img"
    >
      <TrophyIcon tone={tone} className={`${size} drop-shadow-sm`} />
    </span>
  );
}

/** One-line explanation of a badge tier, used on profile pages. */
export function championBadgeLabel(badge: string | null | undefined): string | null {
  const tier = normalize(badge);
  if (!tier) return null;
  if (tier === 'gold') return 'Gold Champion · has held the #1 spot';
  if (tier === 'silver') return 'Silver Champion · has held the #2 spot';
  if (tier === 'bronze') return 'Bronze Champion · has held the #3 spot';
  return 'Champion · has reached the top 100';
}
