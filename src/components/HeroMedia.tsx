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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const activeMediaUrl =
    media.hero_media_type === 'video' && isMobile && media.hero_mobile_media_url
      ? media.hero_mobile_media_url
      : media.hero_media_url;

  const youTubeVideoId =
    media.hero_media_type === 'video' && activeMediaUrl
      ? getYouTubeVideoId(activeMediaUrl)
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
      className="absolute inset-0 h-full w-full overflow-hidden bg-[#0c2229]"
    >
      {media.hero_media_type === 'video' ? (
        youTubeVideoId ? (
          <div className="relative h-full w-full">
            <iframe
              key={youTubeVideoId}
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youTubeVideoId}&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0&enablejsapi=1`}
              title="Hero Background Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-1/2 left-1/2 min-w-full min-h-full w-[177.78vh] h-[56.25vw] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-2 z-30">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-xl transition-all hover:scale-110 active:scale-90"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-xl transition-all hover:scale-110 active:scale-90"
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
              key={activeMediaUrl}
              ref={videoRef}
              src={activeMediaUrl}
              className={`h-full w-full ${isFullscreen ? 'object-contain' : 'object-cover'}`}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-2 z-30">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-xl transition-all hover:scale-110 active:scale-90"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white hover:bg-black/75 shadow-xl transition-all hover:scale-110 active:scale-90"
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
          src={media.hero_media_url || 'https://placehold.co/1600x900.png'}
          alt="Hero Media"
          fill
          priority={true}
          sizes="100vw"
          className="h-full w-full object-cover"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {/* Subtle bottom scrim for editorial legibility */}
      {!isFullscreen && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(180deg, rgba(4,22,28,0.22) 0%, rgba(4,22,28,0.08) 42%, rgba(4,22,28,0.82) 100%)',
          }}
        />
      )}
    </div>
  );
}
