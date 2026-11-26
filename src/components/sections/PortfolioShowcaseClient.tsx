'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortfolioMedia from '../PortfolioMedia';
import LoadingLink from '../LoadingLink';
import { PortfolioItem } from '@/app/admin/settings/actions/portfolio-actions';
import { cn } from '@/lib/utils';

interface PortfolioShowcaseClientProps {
  items: PortfolioItem[];
  title: string;
  subtitle: string;
}

export default function PortfolioShowcaseClient({
  items,
  title,
  subtitle,
}: PortfolioShowcaseClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const activeItem = items[activeIndex] || items[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <section
      id="portfolio"
      className="relative min-h-[720px] w-full overflow-hidden py-16 lg:py-24 bg-black text-white flex flex-col justify-between"
    >
      {/* Dynamic neutral transparent dark-scrimmed background matching active project */}
      {activeItem.mediaType !== 'video' && activeItem.mediaUrl && (
        <div
          key={`bg-${activeItem.id || activeIndex}`}
          className="absolute inset-0 bg-cover bg-center scale-105 opacity-65 transition-all duration-700"
          style={{ backgroundImage: `url(${activeItem.mediaUrl})` }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div className="container relative z-10 flex flex-col items-center">
        {/* Section Heading */}
        <div className="text-center mb-8 max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-white/75">{subtitle}</p>
        </div>

        {/* Single Horizontal Tabs Bar */}
        <div className="w-full overflow-x-auto no-scrollbar mb-10">
          <div className="flex items-center justify-start sm:justify-center gap-6 md:gap-8 min-w-max px-4">
            {items.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    'pb-2 text-sm md:text-base font-medium transition-all whitespace-nowrap border-b-2',
                    isActive
                      ? 'text-white border-white'
                      : 'text-white/60 border-transparent hover:text-white/90'
                  )}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Stage Card + Almost-Invisible Left/Right Arrows */}
        <div className="group/stage relative w-full flex items-center justify-center gap-4 md:gap-14 my-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            aria-label="Previous project"
            className="h-11 w-11 md:h-12 md:w-12 rounded-full border border-white/15 bg-transparent text-white/60 opacity-25 group-hover/stage:opacity-90 hover:bg-white/10 hover:border-white/40 hover:text-white flex-shrink-0 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="relative w-full max-w-[280px] sm:max-w-[330px] md:max-w-[390px] lg:max-w-[420px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)] bg-black">
            <PortfolioMedia item={activeItem} fill={true} />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNext}
            aria-label="Next project"
            className="h-11 w-11 md:h-12 md:w-12 rounded-full border border-white/15 bg-transparent text-white/60 opacity-25 group-hover/stage:opacity-90 hover:bg-white/10 hover:border-white/40 hover:text-white flex-shrink-0 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Bottom Outlined Pill CTA */}
        <div className="mt-10">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 px-8 rounded-full border border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/60 hover:text-white font-medium group"
          >
            <LoadingLink href="/portfolio">
              All projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </LoadingLink>
          </Button>
        </div>
      </div>
    </section>
  );
}
