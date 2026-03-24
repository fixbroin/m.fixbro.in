
'use client';

import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScrollAnimationProps {
  children: React.ReactNode;
  variant?: 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'zoomIn';
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const animationVariants: Record<string, Variants> = {
  fadeInUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  zoomIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  variant = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  once = true,
  className,
  as = 'div',
}) => {
  const MotionComponent = motion[as];

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      transition={{ duration, delay, ease: [0.25, 1, 0.5, 1] }}
      variants={animationVariants[variant]}
      className={cn(className)}
    >
      {children}
    </MotionComponent>
  );
};

export default ScrollAnimation;
