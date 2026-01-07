'use client';

import { CookieConsent } from '@/components/CookieConsent';
import { useAuth } from '@/lib/hooks/useAuth';

export function CookieConsentWrapper() {
  const { updateCookieConsent } = useAuth();

  const handleCookieChoice = (choice: 'accepted' | 'declined' | null) => {
    updateCookieConsent(choice);
  };

  return <CookieConsent onChoice={handleCookieChoice} />;
}
