
'use client';
import {createContext, useContext} from 'react';
import AnalyticsProviderClient from './AnalyticsProviderClient';

type EventType = 'page_visit' | 'user_action' | 'booking_funnel';

interface AnalyticsContextType {
  trackEvent: (eventType: EventType, data: Record<string, any>) => void;
  pageview: (pageUrl: string) => () => void;
  sessionId: string;
  userId: string | null;
}

export const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
    return <AnalyticsProviderClient>{children}</AnalyticsProviderClient>
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
