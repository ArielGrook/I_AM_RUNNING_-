'use client';

import { CookieConsent } from '@/components/CookieConsent';
import { useAuth } from '@/lib/hooks/useAuth';

export function CookieConsentWrapper() {
  // Temporarily disabled to debug infinite loop
  // const { updateCookieConsent } = useAuth();

  // const handleCookieChoice = (choice: 'accepted' | 'declined' | null) => {
  //   updateCookieConsent(choice);
  // };

  // return <CookieConsent onChoice={handleCookieChoice} />;
  return null; // Disabled for debugging
}
