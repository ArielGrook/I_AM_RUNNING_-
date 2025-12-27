'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

type FloatingProps = {
  children: ReactNode;
  className?: string;
  durationMs?: number;
  delayMs?: number;
};

export function Floating({ children, className, durationMs = 6000, delayMs = 0 }: FloatingProps) {
  return (
    <div
      className={clsx('floating-soft', className)}
      style={{ animationDuration: `${durationMs}ms`, animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

