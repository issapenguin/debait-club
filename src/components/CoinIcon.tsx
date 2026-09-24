// d-coin: the club's currency icon. A gold coin with the fishhook "d"
// brand mark at its center (same path as Logo, scaled into the coin).
export function CoinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#E9B44C" />
      <circle
        cx="24"
        cy="24"
        r="18.5"
        fill="none"
        stroke="#B57E1B"
        strokeWidth="2"
      />
      <g transform="translate(10.8 10.8) scale(0.55)" fill="#8A6D1B">
        <path
          d="M31.43 2.00L31.87 2.00L32.42 2.26L33.57 3.34L34.19 4.25L35.00 5.83L35.51 7.62L35.66 10.95L36.65 20.65L36.87 26.03L36.83 28.92L36.68 30.94L36.35 33.43L35.81 35.84L34.89 38.29L34.34 39.39L33.32 40.93L31.80 42.60L30.77 43.47L29.75 44.17L28.50 44.83L27.26 45.34L24.73 45.89L22.02 46.00L20.45 45.82L19.50 45.60L17.52 44.90L15.51 43.69L14.81 43.14L13.88 42.21L12.71 40.75L11.61 38.48L11.17 36.72L11.13 34.60L11.46 32.80L12.38 30.39L13.15 29.11L14.79 27.06L16.46 25.57L18.55 24.26L20.16 23.49L22.94 22.61L24.11 22.46L24.11 22.65L23.16 23.23L22.48 23.87L21.49 25.15L20.87 26.29L20.36 27.57L19.85 29.36L19.41 31.38L19.13 33.41L18.93 33.10L18.60 30.17L18.31 29.36L18.14 29.20L17.78 29.05L17.26 29.16L16.86 29.42L16.22 30.20L15.38 32.00L15.01 33.79L15.01 35.18L15.49 36.94L16.48 38.59L17.01 39.19L18.25 40.22L19.31 40.80L20.71 41.31L22.50 41.57L24.62 41.42L25.98 41.02L26.82 40.62L27.81 40.07L28.87 39.19L29.77 38.26L30.39 37.42L31.08 36.28L31.85 34.56L32.58 31.82L33.10 28.59L33.39 24.20L33.43 20.76L33.24 16.44L32.69 12.41L32.31 11.85L31.25 11.37L30.09 10.47L29.29 9.30L29.03 8.64L28.89 7.77L28.89 6.92L29.07 5.83L29.62 4.25L30.61 2.60L31.10 2.15L31.43 2.00ZM31.87 4.97L31.56 5.24L31.27 5.86L31.12 6.52L31.12 7.55L31.41 8.42L31.80 8.85L32.02 8.96L32.27 8.96L32.69 8.68L33.02 8.17L33.17 7.62L33.17 6.92L32.99 6.12L32.69 5.53L32.31 5.07L32.09 4.97L31.87 4.97Z"
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

/** Inline "N d-coins" label with the coin icon. */
export function DCoinLabel({
  amount,
  className = '',
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <CoinIcon className="h-4 w-4" />
      <span className="font-semibold">
        {amount.toLocaleString()}
      </span>{' '}
      <span className="font-normal text-neutral-400">
        d-coins
      </span>
    </span>
  );
}
