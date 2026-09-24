import type { ReactNode } from 'react';

/**
 * Renders [text](url) links as real anchors.
 * Safety: only http/https URLs become links; everything else is rendered as
 * plain text. No raw HTML is ever interpreted.
 */
export function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    const [full, label, rawUrl] = match;
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    let href: string | null = null;
    try {
      const url = new URL(rawUrl, 'https://debait.club');
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        href = url.toString();
      }
    } catch {
      href = null;
    }
    if (href) {
      nodes.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 underline decoration-sky-300 underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </a>
      );
    } else {
      nodes.push(<span key={key++}>{full}</span>);
    }
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return nodes;
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate.length <= 10 ? `${isoDate}T12:00:00` : isoDate);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
