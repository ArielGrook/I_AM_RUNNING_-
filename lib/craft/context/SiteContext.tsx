'use client';

import React from 'react';

interface SiteContextValue {
  colorScheme: 'dark' | 'light';
  toggleTheme: () => void;
  showThemeToggle: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  availableLanguages: string[];
  showLanguageToggle: boolean;
}

const SiteContext = React.createContext<SiteContextValue>({
  colorScheme: 'dark',
  toggleTheme: () => {},
  showThemeToggle: false,
  language: 'en',
  setLanguage: () => {},
  availableLanguages: ['en'],
  showLanguageToggle: false,
});

export function useSiteContext() {
  return React.useContext(SiteContext);
}

export { SiteContext };
