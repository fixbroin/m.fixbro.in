'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Expand, Shrink, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomePageContent } from '@/app/admin/settings/actions/home-actions';

interface HeroMediaProps {
  media: HomePageContent;
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function HeroMedia({ media }: HeroMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const youTubeVideoId =
    media.hero_media_type === 'video' && media.hero_media_url
      ? getYouTubeVideoId(media.hero_media_url)
      : null;

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

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullscreen ? 'w-screen h-screen rounded-none' : 'aspect-video w-full rounded-[2rem]'} overflow-hidden bg-black flex items-center justify-center shadow-2xl group`}
    >
      {media.hero_media_type === 'video' ? (
        youTubeVideoId ? (
          <div className="relative h-full w-full">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youTubeVideoId}&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0&enablejsapi=1`}
              title="Hero Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full object-contain pointer-events-none"
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
                {isFullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              src={media.hero_media_url}
              className="h-full w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
                {isFullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        )
      ) : (
        <Image
          src={media.hero_media_url || 'https://placehold.co/800x600.png'}
          alt="Hero Media"
          fill
          priority={true}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="h-full w-full object-cover"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          unoptimized
        />
      )}
    </div>
  );
}
