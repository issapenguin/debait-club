// Brand mark: a standalone lowercase fishhook "d", drawn as a single-color
// stroked mark via currentColor so it follows light/dark mode. Square viewBox
// so it fills square display boxes without letterboxing.
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Debait Club home"
      role="img"
    >
      {/* bowl of the d */}
      <circle cx="23" cy="25" r="11" />
      {/* stem: tall ascender, drops below the bowl and curls into a fishhook */}
      <path d="M34 8 V37 C34 43.5 25.5 45 21.5 40.5" />
      {/* barb, flat-cut tip so it stays sharp instead of blunting into a nub */}
      <path d="M21.5 40.5 L27.5 44" strokeLinecap="butt" />
    </svg>
  );
}
