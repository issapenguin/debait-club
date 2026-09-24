import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community rules — Debait Club',
  description: 'The house rules of Debait Club. Debate hard, stay decent.',
};

const RULES: { title: string; body: string }[] = [
  {
    title: '13 and up only',
    body: 'You must be at least 13 years old to join Debait Club. Signup requires a birth date, and accounts found to belong to under-13s will be removed.',
  },
  {
    title: 'Attack the case, never the person',
    body: 'Disagree as fiercely as you like with what someone wrote. The moment it becomes about who they are instead of what they said, you have lost the debate and broken the rules.',
  },
  {
    title: 'No hateful content or slurs',
    body: 'Slurs, hate speech, and dehumanizing language about any group are never allowed — not even quoted, not even "as a joke". Posts are screened automatically and reviewed by moderators.',
  },
  {
    title: 'No harassment',
    body: 'No dogpiling, no following someone across threads to heckle them, no threats, no posting private personal information. If someone asks you to drop it, drop it.',
  },
  {
    title: 'No spam',
    body: 'No ads, no referral links, no copy-pasted walls of text across multiple cases, no flooding the same point over and over. One strong case beats ten loud ones.',
  },
  {
    title: 'Bring something real',
    body: 'Cases should make a claim and back it with reasoning or evidence. "You are wrong" is not a case. Links in [text](url) format are encouraged.',
  },
  {
    title: 'Keep it clean',
    body: 'No profanity, period. Strong language is blocked automatically, and repeat offenders lose posting privileges. Keep it clean enough for a bright thirteen-year-old — which, given the signup rules, might literally be reading.',
  },
  {
    title: 'Own your words',
    body: 'You can edit your bio, but cases and comments stand as written. Think before you post; the club remembers.',
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        House rules
      </h1>
      <p className="mt-2 text-[15px] italic text-neutral-500 dark:text-neutral-400">
        Debate hard. Stay decent. Change your mind once in a while.
      </p>
      <ol className="mt-8 space-y-4">
        {RULES.map((rule, i) => (
          <li
            key={rule.title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              <span className="mr-2 text-neutral-400">{i + 1}.</span>
              {rule.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              {rule.body}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-neutral-400">
        Breaking the rules can get your cases removed and your account suspended.
        Use the Report option in the “…” menu if you see something that crosses the line.
      </p>
    </div>
  );
}
