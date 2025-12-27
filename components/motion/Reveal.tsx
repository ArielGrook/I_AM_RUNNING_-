'use client';

import { ReactNode, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  className?: string;
  once?: boolean;
};

export function Reveal({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  className,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-10% 0px' });
  const prefersReducedMotion = useReducedMotion();

  const getOffset = () => {
    switch (direction) {
      case 'up':
        return { y: 24 };
      case 'down':
        return { y: -24 };
      case 'left':
        return { x: 24 };
      case 'right':
        return { x: -24 };
      default:
        return {};
    }
  };

  const hidden = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, ...getOffset() };
  const visible = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 };

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={inView ? visible : hidden}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

