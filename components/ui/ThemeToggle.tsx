'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;
  const isDark = current === 'dark';
  const prefersReducedMotion = useReducedMotion();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative overflow-hidden rounded-full glow-ring transition-colors duration-300"
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ background: isDark ? 'radial-gradient(circle at 30% 30%, rgba(255,107,53,0.18), transparent 55%)' : 'radial-gradient(circle at 70% 70%, rgba(255,107,53,0.14), transparent 55%)' }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      />
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: prefersReducedMotion ? 0 : -60 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: prefersReducedMotion ? 0 : 60 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="relative"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}


