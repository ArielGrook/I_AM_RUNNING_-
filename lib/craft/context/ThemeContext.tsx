'use client';

import React, { useMemo, useState, useCallback } from 'react';

export type CanvasColorScheme = 'dark' | 'light';

export interface ThemeState {
  accentColor: string;
  colorScheme: CanvasColorScheme;
  accentGradient?: string;
  accentType?: 'solid' | 'gradient';
}

const defaultTheme: ThemeState = {
  accentColor: '#FF6B35',
  colorScheme: 'dark',
  accentType: 'solid',
};

export const ThemeContext = React.createContext<{
  theme: ThemeState;
  setAccentColor: (color: string) => void;
  setColorScheme: (scheme: CanvasColorScheme) => void;
  setAccentGradient: (gradient: string) => void;
  setAccentType: (type: 'solid' | 'gradient') => void;
}>({
  theme: defaultTheme,
  setAccentColor: () => {},
  setColorScheme: () => {},
  setAccentGradient: () => {},
  setAccentType: () => {},
});

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: Partial<ThemeState>;
}) {
  const [theme, setTheme] = useState<ThemeState>({
    ...defaultTheme,
    ...initialTheme,
  });

  const setAccentColor = useCallback((color: string) => {
    setTheme((prev) => ({ ...prev, accentColor: color, accentType: 'solid' }));
  }, []);

  const setColorScheme = useCallback((scheme: CanvasColorScheme) => {
    setTheme((prev) => ({ ...prev, colorScheme: scheme }));
  }, []);

  const setAccentGradient = useCallback((gradient: string) => {
    setTheme((prev) => ({ ...prev, accentGradient: gradient, accentType: 'gradient' }));
  }, []);

  const setAccentType = useCallback((type: 'solid' | 'gradient') => {
    setTheme((prev) => ({ ...prev, accentType: type }));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setAccentColor,
      setColorScheme,
      setAccentGradient,
      setAccentType,
    }),
    [theme, setAccentColor, setColorScheme, setAccentGradient, setAccentType]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: defaultTheme,
      setAccentColor: () => {},
      setColorScheme: () => {},
      setAccentGradient: () => {},
      setAccentType: () => {},
    };
  }
  return ctx;
}
