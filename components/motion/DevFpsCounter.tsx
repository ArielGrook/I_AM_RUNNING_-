'use client';

import { useEffect, useRef, useState } from 'react';

export function DevFpsCounter() {
  const [fps, setFps] = useState(0);
  const last = useRef(performance.now());
  const frames = useRef(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const loop = (now: number) => {
      frames.current += 1;
      const delta = now - last.current;
      if (delta >= 500) {
        setFps(Math.round((frames.current / delta) * 1000));
        frames.current = 0;
        last.current = now;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-3 right-3 z-[9999] rounded-md bg-black/70 px-3 py-2 text-xs font-semibold text-orange-400 shadow-lg backdrop-blur">
      FPS: {fps}
    </div>
  );
}

