
"use client";

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import type { SectionVantaConfig } from '@/types/firestore';

declare global {
  interface Window {
    VANTA: any;
  }
}

interface VantaBackgroundProps {
  sectionConfig: SectionVantaConfig | undefined;
  className?: string;
}

const VantaBackground = ({ sectionConfig, className }: VantaBackgroundProps) => {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef(null);
  const { resolvedTheme } = useTheme();

  // Effect for creating and destroying the Vanta instance
  useEffect(() => {
    let effect: any = null;
    let timer: any = null;

    const initVanta = () => {
        if (!sectionConfig?.enabled || !vantaRef.current || !window.VANTA) {
            return false;
        }

        const effectName = sectionConfig.effect?.toUpperCase();
        if (!effectName || !window.VANTA[effectName]) {
            console.warn(`Vanta effect "${effectName}" not found.`);
            return false;
        }
        
        const isDark = resolvedTheme === 'dark';
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        effect = window.VANTA[effectName]({
            el: vantaRef.current,
            mouseControls: !isMobile,
            touchControls: isMobile,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 3.00, // 🚀 High scale on mobile = fewer pixels to calculate = smoother scroll
            color: isDark ? sectionConfig.color1 : sectionConfig.color2,
            backgroundColor: isDark ? sectionConfig.color2 : sectionConfig.color1,
            ...(sectionConfig.effect === 'BIRDS' && { birdSize: 1.5, speedLimit: 4, separation: 30, quantity: 3.0 }),
            ...(sectionConfig.effect === 'NET' && { maxDistance: 22.00, spacing: 18.00 }),
            ...(sectionConfig.effect === 'WAVES' && { waveHeight: 15.00, shininess: 40.00, waveSpeed: 0.5, zoom: 0.8 }),
        });

        setVantaEffect(effect);
        return true;
    };

    if (!initVanta()) {
        // If it failed to init, try again a few times
        let attempts = 0;
        timer = setInterval(() => {
            attempts++;
            if (initVanta() || attempts > 20) {
                clearInterval(timer);
            }
        }, 500);
    }

    return () => {
      if (effect) {
        effect.destroy();
        setVantaEffect(null);
      }
      if (timer) clearInterval(timer);
    };
  }, [sectionConfig, resolvedTheme]); // Rerun if config or theme changes

  if (!sectionConfig?.enabled) {
    return null;
  }

  return <div ref={vantaRef} className={className || "absolute inset-0 -z-10"} />;
};

export default VantaBackground;
