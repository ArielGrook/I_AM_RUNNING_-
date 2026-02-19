'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type EditorTheme = 'light' | 'dark';

type EditorThemeContextType = {
  theme: EditorTheme;
  toggle: () => void;
  /** Shorthand: returns class A for light, class B for dark */
  t: (light: string, dark: string) => string;
};

const Ctx = createContext<EditorThemeContextType>({
  theme: 'light',
  toggle: () => {},
  t: (l) => l,
});

export const useEditorTheme = () => useContext(Ctx);

function getSystemTheme(): EditorTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const EditorThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<EditorTheme>('light');

  // Respect system preference on mount
  useEffect(() => {
    setTheme(getSystemTheme());
  }, []);

  const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);

  const t = useCallback(
    (light: string, dark: string) => (theme === 'light' ? light : dark),
    [theme]
  );

  return <Ctx.Provider value={{ theme, toggle, t }}>{children}</Ctx.Provider>;
};
