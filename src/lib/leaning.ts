// "The club is leaning" — overall topic sentiment derived from d-coins
// (upvotes) on for vs. against cases.

export type Leaning =
  | 'strongly_for'
  | 'for'
  | 'neutral'
  | 'against'
  | 'strongly_against';

export const LEANING_LABELS: Record<Leaning, string> = {
  strongly_for: 'Strongly for',
  for: 'For',
  neutral: 'Neutral',
  against: 'Against',
  strongly_against: 'Strongly against',
};

/**
 * Determines the club's leaning from total d-coins on for vs. against cases.
 * Symmetric share bands: >=65% strongly, >=55% plain, 45-55% neutral.
 */
export function computeLeaning(forVotes: number, againstVotes: number): Leaning {
  const total = forVotes + againstVotes;
  if (total === 0) return 'neutral';
  const forShare = forVotes / total;
  if (forShare >= 0.65) return 'strongly_for';
  if (forShare >= 0.55) return 'for';
  if (forShare <= 0.35) return 'strongly_against';
  if (forShare <= 0.45) return 'against';
  return 'neutral';
}
