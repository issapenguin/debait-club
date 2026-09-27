'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { startView, endView, pauseView, resumeView } from '@/lib/viewTracker';

// Fires a lightweight page-view beacon on every client-side navigation and
// records time-on-page (dwell) when the view ends. Server-rendered hits are
// not counted; bots that don't run JS aren't either.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    startView(pathname);
  }, [pathname]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pauseView();
      else resumeView();
    };
    const onPageHide = (e: PageTransitionEvent) => {
      // bfcache: page may come back; real unload: record dwell now.
      if (e.persisted) pauseView();
      else endView();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resumeView();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  return null;
}
