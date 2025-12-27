'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type UseTypewriterOptions = {
  speed?: number; // ms per character
  startDelay?: number;
  pauseOnPunctuation?: boolean;
  cursor?: boolean;
};

const PUNCTUATION_PAUSE = 280;

export function useTypewriter(
  text: string,
  { speed = 45, startDelay = 0, pauseOnPunctuation = true, cursor = true }: UseTypewriterOptions = {}
) {
  const [display, setDisplay] = useState(startDelay > 0 ? '' : text[0] ?? '');
  const [done, setDone] = useState(false);
  const indexRef = useRef(startDelay > 0 ? 0 : 1);
  const cursorVisible = cursor && !done;

  const steps = useMemo(() => text.split(''), [text]);

  useEffect(() => {
    let frame: ReturnType<typeof setTimeout>;
    if (startDelay > 0) {
      frame = setTimeout(() => setDisplay(''), startDelay);
    }
    return () => clearTimeout(frame);
  }, [startDelay]);

  useEffect(() => {
    if (done) return;
    const i = indexRef.current;
    if (i > steps.length) return;

    const char = steps[i - 1];
    const isPunctuation = pauseOnPunctuation && char && /[.,!?]/.test(char);
    const delay = isPunctuation ? PUNCTUATION_PAUSE : speed;

    const timer = setTimeout(() => {
      setDisplay((prev) => prev + (char ?? ''));
      indexRef.current = i + 1;
      if (i >= steps.length) {
        setDone(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [done, pauseOnPunctuation, speed, steps]);

  return { text: display, done, cursorVisible };
}

