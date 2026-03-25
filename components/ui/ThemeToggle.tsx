'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;
  const isDark = current === 'dark';
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative p-2 rounded-full transition-colors hover:bg-foreground/5 text-foreground"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: prefersReducedMotion ? 0 : -60 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: prefersReducedMotion ? 0 : 60 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
        >
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
