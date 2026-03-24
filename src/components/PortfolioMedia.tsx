
'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PortfolioItem } from '@/app/admin/settings/actions/portfolio-actions';

interface PortfolioMediaProps {
  item: PortfolioItem;
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  // Support for: watch?v=, v/, u/w/1/..., embed/, youtu.be/, shorts/
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
}

export default function PortfolioMedia({ item }: PortfolioMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youTubeVideoId = item.mediaType === 'video' && item.mediaUrl ? getYouTubeVideoId(item.mediaUrl) : null;

  if (!item.mediaUrl) {
    return (
      <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-medium">
        <span>No media available</span>
      </div>
    );
  }

  const handleFullscreen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const video = videoRef.current;
    if (!video) return;

    try {
        video.muted = false; // Unmute before entering fullscreen
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if ((video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen(); // iOS Safari
        } else if ((video as any).webkitRequestFullscreen) {
          (video as any).webkitRequestFullscreen();
        } else if ((video as any).mozRequestFullScreen) {
          (video as any).mozRequestFullScreen();
        } else if ((video as any).msRequestFullscreen) {
          (video as any).msRequestFullscreen();
        }
    } catch (err) {
        console.error("Fullscreen error:", err);
    }
  };
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onFullscreenChange = () => {
      if (document.fullscreenElement === video) {
        video.muted = false;
        video.controls = true;
      } else {
        video.muted = true;
        video.controls = false;
      }
    };
    
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };

  }, []);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex items-center justify-center">
       {item.mediaType === 'video' ? (
        youTubeVideoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youTubeVideoId}&controls=1&playsinline=1&rel=0`}
            title={item.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          ></iframe>
        ) : (
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              src={item.mediaUrl}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40 z-30 pointer-events-auto shadow-2xl transition-all hover:scale-110 active:scale-90"
              onClick={handleFullscreen}
              aria-label="Play video in fullscreen"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        )
      ) : (
        <Image
          src={item.mediaUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="portfolio item"
        />
      )}
    </div>
  );
}
