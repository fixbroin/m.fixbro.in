'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PortfolioItem } from '@/app/admin/settings/actions/portfolio-actions';

interface PortfolioMediaProps {
  item: PortfolioItem;
  fill?: boolean;
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function PortfolioMedia({ item, fill = true }: PortfolioMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const youTubeVideoId =
    item.mediaType === 'video' && item.mediaUrl ? getYouTubeVideoId(item.mediaUrl) : null;

  const setYouTubeMute = (mute: boolean) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: mute ? 'mute' : 'unMute',
          args: [],
        }),
        '*'
      );
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement || (document as any).webkitFullscreenElement;
      const active = fsEl === containerRef.current;
      setIsFullscreen(active);

      if (!active) {
        if (youTubeVideoId) {
          setYouTubeMute(true);
          setIsMuted(true);
        } else if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
        }
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [youTubeVideoId]);

  if (!item.mediaUrl) {
    return (
      <div className={fill ? 'h-full w-full' : 'aspect-video w-full'}>
        <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-medium">
          <span>No media available</span>
        </div>
      </div>
    );
  }

  const toggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (youTubeVideoId) {
      setYouTubeMute(nextMuted);
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleFullscreen = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const currentFs =
        document.fullscreenElement || (document as any).webkitFullscreenElement;

      if (currentFs) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        return;
      }

      const target = containerRef.current;
      if (!target) return;

      if (youTubeVideoId) {
        setYouTubeMute(false);
        setIsMuted(false);
      } else if (videoRef.current) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }

      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      } else if ((target as any).mozRequestFullScreen) {
        (target as any).mozRequestFullScreen();
      } else if ((target as any).msRequestFullscreen) {
        (target as any).msRequestFullscreen();
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullscreen ? 'w-screen h-screen' : fill ? 'h-full w-full' : 'w-full'} bg-black overflow-hidden flex items-center justify-center`}
    >
      {item.mediaType === 'video' ? (
        youTubeVideoId ? (
          <div className={`relative ${isFullscreen ? 'h-full w-full' : fill ? 'h-full w-full' : 'aspect-video w-full'}`}>
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youTubeVideoId}&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0&enablejsapi=1`}
              title={item.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full object-cover pointer-events-none"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-30">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-2xl transition-all hover:scale-110 active:scale-90"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-2xl transition-all hover:scale-110 active:scale-90"
                onClick={handleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Play video in fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className={`relative ${isFullscreen ? 'h-full w-full' : fill ? 'h-full w-full' : 'w-full'}`}>
            <video
              ref={videoRef}
              src={item.mediaUrl}
              className={`${isFullscreen ? 'h-full w-full object-contain' : fill ? 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105' : 'h-auto w-full transition-transform duration-500 group-hover:scale-105'}`}
              autoPlay
              loop
              muted
              playsInline
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-30">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-2xl transition-all hover:scale-110 active:scale-90"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-2xl transition-all hover:scale-110 active:scale-90"
                onClick={handleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Play video in fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        )
      ) : fill ? (
        <Image
          src={item.mediaUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="portfolio item"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          unoptimized
        />
      ) : (
        <img
          src={item.mediaUrl}
          alt={item.title}
          className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="portfolio item"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}
