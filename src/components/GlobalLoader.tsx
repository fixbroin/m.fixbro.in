
'use client';

import { useLoading } from '@/context/LoadingContext';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLoader from './AppLoader';
import { getGeneralSettings } from '@/app/admin/settings/actions/general-actions';
import type { GeneralSettings } from '@/app/admin/settings/actions/general-actions';

export default function GlobalLoader() {
  const { isLoading, hideLoader } = useLoading();
  const pathname = usePathname();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    hideLoader();
  }, [pathname, hideLoader]);

  useEffect(() => {
    async function fetchSettings() {
      setIsSettingsLoading(true);
      const generalSettings = await getGeneralSettings();
      setSettings(generalSettings);
      setIsSettingsLoading(false);
    }
    fetchSettings();
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <AppLoader 
      settings={settings}
      isLoading={isSettingsLoading}
    />
  );
}
