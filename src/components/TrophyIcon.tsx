/** Trophy silhouette used for champion badges. Tone drives the metallic color. */
export function TrophyIcon({
  tone,
  className = '',
}: {
  tone: 'gold' | 'silver' | 'bronze' | 'muted';
  className?: string;
}) {
  const color =
    tone === 'gold'
      ? '#eab308'
      : tone === 'silver'
        ? '#9ca3af'
        : tone === 'bronze'
          ? '#b45309'
          : '#a8a29e';
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 2h12v2h4v3c0 2.8-2.2 5-5 5h-.6A6 6 0 0 1 13 14.9V18h3v2H8v-2h3v-3.1A6 6 0 0 1 7.6 12H7c-2.8 0-5-2.2-5-5V4h4V2zm-2 4H4v1c0 1.7 1.3 3 3 3V6zm16 0h-3v4c1.7 0 3-1.3 3-3V6z" />
    </svg>
  );
}
