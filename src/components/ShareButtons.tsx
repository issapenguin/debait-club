'use client';

const SITE_URL = 'https://www.debait.club';

function xShareHref(topicId: number, proposition: string): string {
  const url = `${SITE_URL}/topic/${topicId}`;
  const text = `Debate this: ${proposition}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

function fbShareHref(topicId: number): string {
  const url = `${SITE_URL}/topic/${topicId}`;
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

function XIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

function FacebookIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/** Share links for a topic: X and Facebook intents pointing at the canonical topic URL. */
export function ShareButtons({
  topicId,
  proposition,
}: {
  topicId: number;
  proposition: string;
}) {
  const buttonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-50';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
        Share
      </span>
      <a
        href={xShareHref(topicId, proposition)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share this debate on X"
        title="Share on X"
        className={buttonClass}
      >
        <XIcon />
      </a>
      <a
        href={fbShareHref(topicId)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share this debate on Facebook"
        title="Share on Facebook"
        className={buttonClass}
      >
        <FacebookIcon />
      </a>
    </div>
  );
}
