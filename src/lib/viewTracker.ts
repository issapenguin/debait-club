// Client-side view tracking: page-view beacons plus time-on-page (dwell).
//
// startView(path) ends any in-progress view (recording its dwell) and logs a
// new page_views row. Dwell is recorded by POSTing to /api/pageview/dwell,
// which calls the record_dwell RPC — the anon key never gets UPDATE rights.
//
// Dwell timer pauses while the tab is hidden so background tabs don't inflate
// numbers. fetch with keepalive survives page unload.

type PendingView = {
  idPromise: Promise<number | null>;
  start: number;
  pausedAt: number | null;
  sent: boolean;
};

let current: PendingView | null = null;

async function postView(path: string): Promise<number | null> {
  try {
    const res = await fetch('/api/pageview', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      id?: unknown;
    } | null;
    return typeof json?.id === 'number' ? json.id : null;
  } catch {
    return null;
  }
}

function postDwell(id: number, dwellMs: number): void {
  try {
    fetch('/api/pageview/dwell', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, dwellMs }),
    }).catch(() => {});
  } catch {
    // Analytics must never break the page.
  }
}

/** End the current view, recording how long it was actually visible. */
export function endView(): void {
  const v = current;
  current = null;
  if (!v || v.sent) return;
  v.sent = true;
  const dwellMs = Math.max(0, (v.pausedAt ?? Date.now()) - v.start);
  v.idPromise
    .then((id) => {
      if (id != null) postDwell(id, dwellMs);
    })
    .catch(() => {});
}

/** Begin a new tracked view for the given path. */
export function startView(path: string): void {
  endView();
  current = {
    idPromise: postView(path),
    start: Date.now(),
    pausedAt: null,
    sent: false,
  };
}

/** Freeze the dwell timer (tab hidden). */
export function pauseView(): void {
  if (current && !current.sent && current.pausedAt == null) {
    current.pausedAt = Date.now();
  }
}

/** Resume the dwell timer (tab visible again). */
export function resumeView(): void {
  const v = current;
  if (v && !v.sent && v.pausedAt != null) {
    v.start += Date.now() - v.pausedAt;
    v.pausedAt = null;
  }
}
