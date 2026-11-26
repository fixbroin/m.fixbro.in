'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { GeneralSettings } from '@/app/admin/settings/actions/general-actions';

export default function SplashPreloader({
  settings,
}: {
  settings: GeneralSettings | null;
}) {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith('/admin'));
  const [phase, setPhase] = useState<'center' | 'docking' | 'done'>('center');
  const [dockStyle, setDockStyle] = useState<{
    x: number;
    y: number;
    scale: number;
  } | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdmin) {
      setPhase('done');
      return;
    }

    const dockTimer = setTimeout(() => {
      const targetEl = document.querySelector(
        'header a[href="/"] img, header a[href="/"] > div'
      ) as HTMLElement | null;
      const splashEl = logoRef.current;

      if (targetEl && splashEl) {
        const targetRect = targetEl.getBoundingClientRect();
        const splashRect = splashEl.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const splashCenterX = splashRect.left + splashRect.width / 2;
        const splashCenterY = splashRect.top + splashRect.height / 2;

        setDockStyle({
          x: targetCenterX - splashCenterX,
          y: targetCenterY - splashCenterY,
          scale: splashRect.width > 0 ? targetRect.width / splashRect.width : 0.6,
        });
      }
      setPhase('docking');
    }, 650);

    const doneTimer = setTimeout(() => {
      setPhase('done');
    }, 1800);

    return () => {
      clearTimeout(dockTimer);
      clearTimeout(doneTimer);
    };
  }, [isAdmin]);

  if (isAdmin || phase === 'done') return null;

  const appName = settings?.website_name || 'FixBro Interiors';
  const logoUrl = settings?.logo;
  const isDocking = phase === 'docking';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
    >
      {/* Background fades slowly so the header logo area is revealed smoothly */}
      <div
        className={`absolute inset-0 bg-background transition-opacity duration-[1000ms] ease-out ${
          isDocking ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Brand group */}
      <div className="relative z-10 flex items-center gap-4">
        <div
          ref={logoRef}
          style={{
            transition: 'transform 1050ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1050ms ease-out',
            transform: isDocking
              ? dockStyle
                ? `translate3d(${dockStyle.x}px, ${dockStyle.y}px, 0) scale(${dockStyle.scale})`
                : 'translate3d(calc(-50vw + 96px), calc(-50vh + 40px), 0) scale(0.6)'
              : 'translate3d(0, 0, 0) scale(1)',
            opacity: isDocking ? 0.95 : 1,
          }}
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
        </div>

        <span
          className={`font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground whitespace-nowrap transition-opacity duration-500 ease-out ${
            isDocking ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {appName}
        </span>
      </div>
    </div>
  );
}
