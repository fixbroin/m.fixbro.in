'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScrollToTopButton() {
  const pathname = usePathname();
  const [scrollPercent, setScrollPercent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent =
        docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100))) : 0;

      setScrollPercent(percent);
      setVisible(scrollTop > 250);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  if (pathname?.startsWith('/admin')) return null;

  const size = 56;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={`Scroll to top (${scrollPercent}%)`}
      className={cn(
        'fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full flex items-center justify-center',
        'bg-white/85 dark:bg-[#0b181f]/85 backdrop-blur-xl text-foreground shadow-xl',
        'border border-black/10 dark:border-white/15 transition-all duration-300 hover:scale-105 active:scale-95',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/10 dark:text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>

      <span className="relative z-10 flex flex-col items-center justify-center leading-none">
        <ArrowUp className="h-3.5 w-3.5 text-primary mb-0.5" />
        <span className="text-[10px] font-bold tabular-nums text-foreground">
          {scrollPercent}%
        </span>
      </span>
    </button>
  );
}
