'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Service } from '@/app/admin/settings/actions/services-actions';
import DynamicIcon from '../DynamicIcon';
import LoadingLink from '../LoadingLink';
import { cn } from '@/lib/utils';

interface ServicesArcCarouselProps {
  services: Service[];
  title: string;
  subtitle: string;
  useVanta?: boolean;
}

export default function ServicesArcCarousel({
  services,
  title,
  subtitle,
  useVanta = false,
}: ServicesArcCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!services || services.length === 0) return null;

  const total = services.length;
  const activeService = services[activeIndex] || services[0];

  const prev = () => setActiveIndex((i) => (i - 1 + total) % total);
  const next = () => setActiveIndex((i) => (i + 1) % total);

  // Compute circular shortest offset in [-Math.floor(total/2), Math.floor(total/2)]
  const getOffset = (idx: number) => {
    let diff = idx - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 40) prev();
    else if (dx < -40) next();
    touchStartX.current = null;
  };

  return (
    <div className="container relative z-10">
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h2
          className={cn(
            'font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-4',
            useVanta ? 'text-white drop-shadow-md' : 'text-foreground'
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            'mx-auto max-w-xl text-sm sm:text-base font-normal leading-relaxed transition-all duration-300',
            useVanta ? 'text-white/85' : 'text-muted-foreground'
          )}
        >
          {activeService?.description || subtitle}
        </p>
      </div>

      {/* 3D Curved Arc Stage */}
      <div
        className="relative flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Arrow */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous service"
          className="hidden sm:flex absolute left-0 md:left-4 z-30 h-11 w-11 rounded-full bg-card/85 backdrop-blur-md border border-border shadow-md items-center justify-center text-foreground hover:bg-card hover:scale-105 active:scale-95 transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Arc Viewport */}
        <div
          className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] flex items-center justify-center overflow-hidden select-none"
          style={{ perspective: '1200px' }}
        >
          {services.map((service, idx) => {
            const offset = getOffset(idx);
            const absOffset = Math.abs(offset);

            // Only show up to 2 cards on each side of the active center card
            if (absOffset > 2 && total > 4) return null;

            const isCenter = offset === 0;
            const translateX = offset * 215; // horizontal spacing
            const translateZ = -absOffset * 90;
            const rotateY = offset * -18; // curve inward like an arc
            const scale = isCenter ? 1 : absOffset === 1 ? 0.92 : 0.82;
            const opacity = isCenter ? 1 : absOffset === 1 ? 0.92 : 0.72;
            const zIndex = 20 - absOffset * 5;

            const isVideo =
              service.mediaType === 'video' &&
              service.mediaUrl &&
              !service.mediaUrl.includes('youtube.com') &&
              !service.mediaUrl.includes('youtu.be');

            return (
              <div
                key={service.id || idx}
                onClick={() => (isCenter ? undefined : setActiveIndex(idx))}
                className={cn(
                  'absolute w-[220px] sm:w-[250px] md:w-[275px] h-[310px] sm:h-[360px] md:h-[400px] rounded-[1.5rem] overflow-hidden shadow-xl transition-all duration-500 ease-out bg-card border border-border/60',
                  !isCenter && 'cursor-pointer'
                )}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
              >
                {service.mediaUrl && isVideo ? (
                  <video
                    src={service.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controlsList="nodownload"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-full w-full object-cover"
                  />
                ) : service.mediaUrl ? (
                  <img
                    src={service.mediaUrl}
                    alt={service.title}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-secondary/50">
                    <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary">
                      <DynamicIcon name={service.icon} className="h-7 w-7" />
                    </div>
                    <p className="font-display text-2xl font-semibold text-foreground">
                      {service.title}
                    </p>
                  </div>
                )}

                {isCenter && (
                  <LoadingLink
                    href="/services"
                    className="absolute inset-0 z-10"
                    aria-label={`View ${service.title}`}
                  >
                    <span className="sr-only">{service.title}</span>
                  </LoadingLink>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={next}
          aria-label="Next service"
          className="hidden sm:flex absolute right-0 md:right-4 z-30 h-11 w-11 rounded-full bg-card/85 backdrop-blur-md border border-border shadow-md items-center justify-center text-foreground hover:bg-card hover:scale-105 active:scale-95 transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Active Label + Mobile Arrows + Indicator Dots */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous service"
            className="sm:hidden h-9 w-9 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <LoadingLink
            href="/services"
            className={cn(
              'font-display text-2xl md:text-3xl font-medium tracking-tight hover:text-primary transition-colors',
              useVanta ? 'text-white' : 'text-foreground'
            )}
          >
            {activeService?.title}
          </LoadingLink>
          <button
            type="button"
            onClick={next}
            aria-label="Next service"
            className="sm:hidden h-9 w-9 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {services.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Show ${s.title}`}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                idx === activeIndex
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
