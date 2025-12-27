'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

type AssemblyProps = {
  items: { label: string; delay?: number }[];
  className?: string;
};

export function ComponentAssembly({ items, className }: AssemblyProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={clsx('grid gap-2', className)}>
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 border border-white/10"
          initial={{ opacity: 0, x: 12, y: 4 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{
            delay: prefersReducedMotion ? 0 : (item.delay ?? idx * 0.08),
            duration: prefersReducedMotion ? 0 : 0.5,
            type: 'spring',
            stiffness: 120,
            damping: 16,
          }}
        >
          <div className="flex items-center gap-3 text-sm text-white">
            <span className="h-8 w-8 rounded-full bg-white/12 flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </span>
            <div className="font-semibold">{item.label}</div>
          </div>
          <div className="h-2 w-16 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full w-full bg-white/80"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 0.7 }}
              transition={{ duration: prefersReducedMotion ? 0 : 1.1, repeat: prefersReducedMotion ? 0 : Infinity, repeatType: 'reverse' }}
              style={{ originX: 0 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

