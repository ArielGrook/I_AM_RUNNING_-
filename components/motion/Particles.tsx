'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

type ParticleFieldProps = {
  className?: string;
  countDesktop?: number;
  countMobile?: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

export function ParticleField({ className, countDesktop = 90, countMobile = 30 }: ParticleFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const count = prefersReducedMotion ? 0 : isMobile ? countMobile : countDesktop;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Dev diagnostics for animation density
      console.log('[Particles] count', count, 'mobile', isMobile, 'prefersReducedMotion', prefersReducedMotion);
    }
  }, [count, isMobile, prefersReducedMotion]);

  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: count }).map((_, idx) => ({
      id: idx,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 12 + Math.random() * 10,
      delay: Math.random() * 4,
    }));
  }, [count]);

  if (count === 0) return null;

  return (
    <div className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="particle absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(255,107,53,0.9) 0%, rgba(255,107,53,0.2) 70%, transparent 100%)',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.4],
            scale: [0.9, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

