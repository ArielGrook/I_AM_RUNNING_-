'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export type CookieConsentChoice = 'accepted' | 'declined' | null;

interface CookieConsentProps {
  onChoice: (choice: CookieConsentChoice) => void;
}

export function CookieConsent({ onChoice }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const storedChoice = localStorage.getItem('cookie-consent');
    if (!storedChoice) {
      setIsVisible(true);
    } else {
      setHasChoice(true);
      onChoice(storedChoice as CookieConsentChoice);
    }
  }, [onChoice]);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    setHasChoice(true);
    onChoice('accepted');
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    setHasChoice(true);
    onChoice('declined');
  };

  if (!isVisible || hasChoice) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#262626] border-t border-gray-200 dark:border-[#525151] shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We use cookies to keep you logged in and improve your experience. By continuing to use our site, you agree to our use of cookies.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-[#525151] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#525151]"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="bg-[#ffa500] hover:bg-[#8f4701] text-white"
            >
              Accept Cookies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
