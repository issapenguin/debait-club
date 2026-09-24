/** Circular avatar: the user's picture, or their initial as a fallback. */
export function Avatar({
  url,
  username,
  className = 'h-9 w-9 text-sm',
}: {
  url: string | null | undefined;
  username: string;
  className?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={`${username}'s profile picture`}
        className={`rounded-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-sky-600 font-bold text-white ${className}`}
      aria-hidden="true"
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}
