'use client';

import { useEffect, useRef, useState } from 'react';

type Options = {
  duration?: number;
  easing?: (t: number) => number;
  startOnMount?: boolean;
  onComplete?: () => void;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCounterAnimation(from: number, to: number, opts: Options = {}) {
  const { duration = 1500, easing = easeOutCubic, startOnMount = true, onComplete } = opts;
  const [value, setValue] = useState(from);
  const [running, setRunning] = useState(startOnMount);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  const start = () => {
    startRef.current = null;
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    if (!running) return;
    const step = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const progress = Math.min(1, (now - (startRef.current ?? now)) / duration);
      const eased = easing(progress);
      const current = from + (to - from) * eased;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setRunning(false);
        onComplete?.();
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [duration, easing, from, onComplete, running, to]);

  return { value, start, stop, running };
}

