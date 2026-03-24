'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/context/AnalyticsContext';

export default function AnalyticsTracker() {
  const { pageview, sessionId } = useAnalytics();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    // Do not track admin pages
    if (pathname.startsWith('/admin')) {
      return;
    }
    
    // Wait until the sessionId is available before tracking.
    if (!sessionId) {
      return;
    }

    // Combine pathname and searchParams to get the full URL
    const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    // Only track if the path has actually changed
    if (previousPath.current !== currentPath) {
      pageview(currentPath);
      previousPath.current = currentPath;
    }
  }, [pathname, searchParams, pageview, sessionId]);

  return null;
}
