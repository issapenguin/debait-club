// Brand mark: a standalone lowercase fishhook "d", single color via currentColor
// so it follows light/dark mode. No other logo marks.
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      className={className}
      aria-label="Debait Club home"
      role="img"
    >
      {/* bowl of the d */}
      <circle cx="12" cy="21" r="8" />
      {/* stem rising from the bowl */}
      <path d="M20 21 V7" />
      {/* stem dropping below the baseline, curling into a fishhook */}
      <path d="M20 21 V30 C20 35.5 13 36.5 11.5 31" />
      {/* barb */}
      <path d="M11.5 31 L15.8 33.6" />
    </svg>
  );
}
