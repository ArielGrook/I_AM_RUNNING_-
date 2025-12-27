'use client';

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';

type AnimatedCounterProps = {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  progressBar?: boolean;
  progressColor?: string;
  onInView?: boolean;
};

export function AnimatedCounter({
  from = 0,
  to,
  duration = 1500,
  prefix = '',
  suffix = '',
  className,
  progressBar = false,
  progressColor = '#FF6B35',
  onInView = true,
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const shouldRun = onInView ? inView : true;

  const { value, start, running } = useCounterAnimation(from, to, {
    duration: prefersReducedMotion ? 0 : duration,
    startOnMount: !onInView,
  });

  useEffect(() => {
    if (shouldRun && !running) start();
  }, [running, shouldRun, start]);

  const pct = Math.min(100, Math.max(0, ((value - from) / (to - from)) * 100));

  return (
    <div ref={ref} className={clsx('space-y-1', className)}>
      <div className="text-xl font-semibold tabular-nums">
        {prefix}
        {Math.round(value).toLocaleString()}
        {suffix}
      </div>
      {progressBar && (
        <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: progressColor }}
          />
        </div>
      )}
    </div>
  );
}

