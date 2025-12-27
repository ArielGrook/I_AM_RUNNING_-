'use client';

import { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

type ParallaxWrapperProps = {
  children: ReactNode;
  speed?: number; // positive moves opposite scroll slower, negative faster
  className?: string;
  axis?: 'y' | 'x';
};

export function ParallaxWrapper({ children, speed = 0.3, className, axis = 'y' }: ParallaxWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const translate = useTransform(scrollYProgress, [0, 1], [0, speed * -60]);

  const style = prefersReducedMotion
    ? undefined
    : axis === 'y'
    ? { y: translate }
    : { x: translate };

  return (
    <motion.div ref={ref} style={style} className={clsx(className)}>
      {children}
    </motion.div>
  );
}

