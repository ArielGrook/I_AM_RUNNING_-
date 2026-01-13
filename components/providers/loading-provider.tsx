'use client';

import { useState, useEffect } from 'react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '@/lib/hooks/useAuth';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const { loading: authLoading } = useAuth();

  // Track minimum display time for UX (2000ms - ensures auth completes)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏱️ Loading screen minimum time elapsed (2000ms)');
      setMinTimeElapsed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Log auth loading state changes
  useEffect(() => {
    console.log('🔐 Auth loading state:', authLoading ? 'still loading...' : 'COMPLETE');
  }, [authLoading]);

  // Show loading screen until BOTH conditions are met:
  // 1. Minimum display time has elapsed (for UX)
  // 2. Auth check has completed (loading: false)
  const showLoading = !minTimeElapsed || authLoading;

  useEffect(() => {
    if (!showLoading) {
      console.log('✅ Loading screen hiding - auth ready, min time elapsed');
    }
  }, [showLoading]);

  if (showLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}


