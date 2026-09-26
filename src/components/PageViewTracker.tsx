'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Fires a lightweight page-view beacon on every client-side navigation.
// Server-rendered hits are not counted; bots that don't run JS aren't either.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const payload = JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      });
      navigator.sendBeacon(
        '/api/pageview',
        new Blob([payload], { type: 'application/json' }),
      );
    } catch {
      // Analytics must never break the page.
    }
  }, [pathname]);

  return null;
}
