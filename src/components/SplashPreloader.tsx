'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GeneralSettings } from '@/app/admin/settings/actions/general-actions';

export default function SplashPreloader({
  settings,
}: {
  settings: GeneralSettings | null;
}) {
  const [phase, setPhase] = useState<'idle' | 'center' | 'docking' | 'done'>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setPhase('done');
      return;
    }

    setPhase('center');
    const dockTimer = setTimeout(() => {
      setPhase('docking');
    }, 850);

    const doneTimer = setTimeout(() => {
      setPhase('done');
    }, 1550);

    return () => {
      clearTimeout(dockTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'idle' || phase === 'done') return null;

  const appName = settings?.website_name || 'FixBro Interiors';
  const logoUrl = settings?.logo;

  return (
    <AnimatePresence>
      <motion.div
        key="splash-overlay"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'docking' ? 0 : 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[100] bg-background flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, x: 0, y: 0 }}
          animate={
            phase === 'docking'
              ? {
                  x: 'calc(-50vw + 48px)',
                  y: 'calc(-50vh + 36px)',
                  scale: 0.55,
                  opacity: 0.9,
                }
              : { scale: 1, opacity: 1, x: 0, y: 0 }
          }
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-4"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover shadow-lg border border-border bg-card"
            />
          ) : (
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-2xl font-bold shadow-lg">
              {appName.charAt(0)}
            </div>
          )}

          <motion.span
            animate={{ opacity: phase === 'docking' ? 0 : 1 }}
            transition={{ duration: 0.25 }}
            className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground whitespace-nowrap"
          >
            {appName}
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
