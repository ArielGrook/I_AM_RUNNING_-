'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';

type TypewriterTextProps = {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  highlightWords?: string[];
  cursorClassName?: string;
};

export function TypewriterText({
  text,
  speed = 55,
  startDelay = 0,
  className,
  highlightWords = [],
  cursorClassName,
}: TypewriterTextProps) {
  const { text: typed, cursorVisible } = useTypewriter(text, { speed, startDelay });

  const highlighted = useMemo(() => {
    if (!highlightWords.length) return typed;
    let output: (string | JSX.Element)[] = [typed];
    highlightWords.forEach((word) => {
      output = output.flatMap((chunk) => {
        if (typeof chunk !== 'string') return chunk;
        const parts = chunk.split(new RegExp(`(${escapeRegExp(word)})`, 'gi'));
        return parts.map((part, idx) =>
          part.toLowerCase() === word.toLowerCase() ? (
            <span key={`${word}-${idx}`} className="text-orange-200">
              {part}
            </span>
          ) : (
            part
          )
        );
      });
    });
    return output;
  }, [highlightWords, typed]);

  return (
    <span className={clsx('inline-flex items-baseline', className)}>
      <span>{highlighted}</span>
      <span
        className={clsx(
          'inline-block w-[8px] ml-1 h-[1.2em] bg-white align-baseline',
          cursorVisible ? 'opacity-80' : 'opacity-0',
          cursorClassName
        )}
      />
    </span>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

