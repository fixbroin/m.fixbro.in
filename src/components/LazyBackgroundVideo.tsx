'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyBackgroundVideoProps {
  src: string;
  youTubeId?: string | null;
  title?: string;
}

export default function LazyBackgroundVideo({
  src,
  youTubeId,
  title = 'Background video',
}: LazyBackgroundVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {shouldLoad ? (
        youTubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&loop=1&playlist=${youTubeId}&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0`}
            title={title}
            loading="lazy"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-[177.78vh] h-[56.25vw] -translate-x-1/2 -translate-y-1/2"
          />
        ) : (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            controlsList="nodownload"
            disablePictureInPicture
            className="h-full w-full object-cover"
          />
        )
      ) : null}
    </div>
  );
}
