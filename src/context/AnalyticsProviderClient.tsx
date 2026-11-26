
'use client';

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnalyticsContext } from './AnalyticsContext';

const sendData = (url: string, data: any) => {
  // Use navigator.sendBeacon if available, otherwise fallback to fetch
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(error => {
        console.error('Fetch fallback for analytics failed:', error);
    });
  }
};

function getDeviceInfo(userAgent: string | null) {
    if (!userAgent) return 'Unknown';
    if (/mobile/i.test(userAgent)) return 'Mobile';
    return 'Desktop';
}


export default function AnalyticsProviderClient({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string>('');
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }
    // Reuse session ID within the same browser session to avoid duplicate visitor logs
    let session = sessionStorage.getItem('analytics_session_id');
    if (!session) {
      session = uuidv4();
      sessionStorage.setItem('analytics_session_id', session);
    }
    setSessionId(session);

    if (sessionStorage.getItem('analytics_visitor_tracked')) {
      return;
    }

    // Fetch geo data and send initial visitor log
    async function trackVisitor() {
        try {
            const response = await fetch(`https://ipapi.co/json/`);
            if (!response.ok) {
              throw new Error(`ipapi.co failed with status: ${response.status}`);
            }
            const geoData = await response.json();
            const deviceInfo = getDeviceInfo(navigator.userAgent);
            
            const geoDataWithUrl = { ...geoData, pathname: window.location.pathname };
            sendData('/api/track', { sessionId: session, geoData: geoDataWithUrl, deviceInfo });
            sessionStorage.setItem('analytics_visitor_tracked', '1');
        } catch (error) {
            console.error("Failed to track visitor:", error);
             // Fallback with less data if geo lookup fails
            const deviceInfo = getDeviceInfo(navigator.userAgent);
            sendData('/api/track', { sessionId: session, geoData: {ip: 'Error', pathname: window.location.pathname}, deviceInfo });
            sessionStorage.setItem('analytics_visitor_tracked', '1');
        }
    }
    
    trackVisitor();
  }, []);


  const trackEvent = useCallback(
    (eventType: 'page_visit' | 'user_action' | 'booking_funnel', data: Record<string, any>) => {
      if (typeof window === 'undefined' || window.location.pathname.startsWith('/admin') || !sessionId) {
        return;
      }
      
      const eventData = {
        ...data,
        userId: 'guest',
        sessionId: sessionId,
        clientTimestamp: new Date().toISOString(),
      };
      
      sendData('/api/track/event', { eventType, data: eventData });

    },
    [sessionId]
  );

  const pageview = useCallback(
    (pageUrl: string) => {
      trackEvent('page_visit', {
        event: 'page_start',
        pageUrl: pageUrl,
        referrer: document.referrer,
      });

      const startTime = Date.now();

      const handlePageUnload = () => {
        const duration = Date.now() - startTime;
        trackEvent('page_visit', {
          event: 'page_end',
          pageUrl: pageUrl,
          duration,
        });
      };
      
      window.addEventListener('beforeunload', handlePageUnload);

      return () => {
        window.removeEventListener('beforeunload', handlePageUnload);
        handlePageUnload();
      };
    },
    [trackEvent]
  );
  
  const value = {
      trackEvent,
      pageview,
      sessionId,
      userId: null,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
