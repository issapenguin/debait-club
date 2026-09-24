'use client';

// One quote per day, rotating on a fixed cycle. Computed in the browser so it
// always reflects the current UTC date (a server render would freeze the quote
// at build time on statically rendered pages).
const QUOTES = [
  "There's always more to the story.",
  'Question everything.',
  "There's a vast spectrum between right and wrong.",
  'Always be open to new information.',
  "It's okay to unknow what you know.",
  "The answer is rarely here or there. It's usually somewhere in between.",
];

export function DailyQuote() {
  const dayIndex = Math.floor(Date.now() / 86_400_000) % QUOTES.length;
  return <p className="italic">{QUOTES[dayIndex]}</p>;
}
