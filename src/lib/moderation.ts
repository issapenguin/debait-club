// Content moderation for user-submitted cases and comments.
// Zero tolerance: slurs, hateful terms, and all profanity (including
// obfuscated variants) are rejected. The keyword list stays private to
// this file; only moderate() is exported.

const BANNED: string[] = [
  // Racial / ethnic slurs
  'nigger', 'nigga', 'sandnigger', 'chink', 'spic', 'spick', 'kike',
  'gook', 'wetback', 'coon', 'porchmonkey', 'junglebunny', 'spearchucker',
  'paki', 'raghead', 'towelhead', 'beaner', 'cracker', 'honky', 'darkie',
  'kaffir', 'coolie', 'abo', 'wop', 'dago', 'kraut', 'polack',
  'yid', 'heeb', 'jap', 'redskin', 'mulatto', 'gyp', 'gypped',
  'haji',
  // Homophobic / transphobic slurs
  'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'homo', 'lezbo',
  // Misogynistic / sexual slurs
  'cunt', 'whore', 'slut', 'slutty', 'skank', 'twat',
  // Hateful terms
  'retard', 'retarded', 'kys',
  // Profanity — every common form; the old "one f-bomb" allowance is gone
  'fuck', 'fucked', 'fucker', 'fucking', 'fuk', 'motherfucker',
  'shit', 'shitty', 'shite', 'bullshit',
  'bitch', 'bitches', 'biatch',
  'dick', 'dicks', 'dickhead',
  'pussy', 'pussies',
  'ass', 'azz', 'asshole', 'arse', 'arsehole',
  'bastard', 'prick', 'cock', 'cocksucker',
  'boobs', 'tits', 'clit', 'cum', 'jizz', 'dong', 'schlong', 'blowjob',
  'piss', 'pissed', 'crap', 'crappy', 'damn', 'damned', 'hell',
  'douche', 'douchebag', 'wanker', 'jackass', 'dumbass', 'smartass',
  'bollocks',
];

// Single-character obfuscations mapped back to plain letters.
const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's',
  '6': 'g', '7': 't', '8': 'b', '9': 'g',
  '@': 'a', '$': 's', '+': 't', '(': 'c',
  '©': 'c', '€': 'e',
};

// Cyrillic / Greek lookalikes mapped back to Latin letters.
const HOMOGLYPH: Record<string, string> = {
  'а': 'a', 'е': 'e', 'ё': 'e', 'і': 'i', 'ј': 'j', 'о': 'o',
  'р': 'p', 'с': 'c', 'ѕ': 's', 'т': 't', 'х': 'x', 'у': 'y',
  'һ': 'h', 'к': 'k', 'м': 'm', 'н': 'h', 'в': 'b', 'д': 'd',
  'α': 'a', 'ε': 'e', 'ι': 'i', 'ο': 'o', 'ρ': 'p',
  'ς': 's', 'σ': 's', 'τ': 't', 'χ': 'x', 'κ': 'k', 'μ': 'm',
};

function normalize(text: string): string {
  const folded = (
    text
      // "!" standing in for "i" only mid-word, e.g. "sh!t"
      .replace(/([a-zA-Z])!([a-zA-Z])/g, '$1i$2')
      // fold full-width / compatibility characters, then strip diacritics
      .normalize('NFKC')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split('')
      .map((ch) => HOMOGLYPH[ch] ?? LEET[ch] ?? ch)
      .join('')
      // "ph" standing in for "f", e.g. "phuck"
      .replace(/ph/g, 'f')
  );
  const sep = /[\s._\-!~^#|/\\:;,'"()\[\]{}<>\u200b\u200c\u200d\ufeff]+/g;
  return [
    // separators removed: catches "f.u.c.k", "f u c k"
    folded.replace(sep, ''),
    // separators kept as spaces: catches "fuck you" without merging words
    folded.replace(sep, ' '),
  ].join('\n');
}

// Each banned word matches with any letter repeated, so "faaaggot",
// "shiiit", etc. are all caught without collapsing legitimate doubles.
const PATTERNS: RegExp[] = BANNED.map((word) => {
  const body = word
    .split('')
    .map((ch) => `(?:\\*|${ch}+)`)
    .join('');
  return new RegExp(`(^|[^a-z])${body}([^a-z]|$)`);
});

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
        'This contains language that is not allowed on Debait Club. Please rephrase without profanity, slurs, or hateful terms.',
    };
  }
  return { ok: true };
}
