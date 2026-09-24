// Content moderation for user-submitted cases and comments.
// The keyword list stays private to this file; only moderate() is exported.

const BANNED: string[] = [
  // Racial / ethnic slurs
  'nigger', 'nigga', 'chink', 'spic', 'kike', 'gook', 'wetback', 'coon',
  'paki', 'raghead', 'towelhead', 'beaner', 'cracker', 'honky',
  // Homophobic / transphobic slurs
  'faggot', 'fag', 'dyke', 'tranny', 'shemale',
  // Misogynistic / general slurs
  'cunt', 'whore', 'slut',
  // Hateful terms
  'retard', 'retarded',
];

// Common obfuscations mapped back to plain letters before matching.
const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '+': 't',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => LEET[ch] ?? ch)
    .join('')
    // collapse repeated chars used to dodge filters, e.g. "faaaggot"
    .replace(/(.)\1{2,}/g, '$1')
    // drop separators sometimes wedged between letters, e.g. "f.a.g"
    .replace(/[\s._\-*]+/g, '');
}

const PATTERNS: RegExp[] = BANNED.map(
  (word) => new RegExp(`(^|[^a-z])${word}([^a-z]|$)`)
);

export function moderate(text: string): { ok: boolean; reason?: string } {
  if (!text || !text.trim()) {
    return { ok: false, reason: 'Please write something before posting.' };
  }
  const normalized = normalize(text);
  const hit = PATTERNS.some((pattern) => pattern.test(normalized));
  if (hit) {
    return {
      ok: false,
      reason:
        'This contains language that is not allowed on Debait Club. Please rephrase without slurs or hateful terms.',
    };
  }
  return { ok: true };
}
