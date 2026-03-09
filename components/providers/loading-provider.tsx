'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '@/lib/hooks/useAuth';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { loading: authLoading } = useAuth();
  const pathname = usePathname();

  // ============ DIAGNOSTIC ============
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`[LOADING-PROVIDER] Render #${renderCount.current} - authLoading: ${authLoading}, minTimeElapsed: ${minTimeElapsed}, initialLoadComplete: ${initialLoadComplete}, pathname: ${pathname}`);

  // Track minimum display time for UX (500ms - fast since cache is instant)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏱️ [LOADING-PROVIDER] Minimum time elapsed (500ms)');
      setMinTimeElapsed(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Mark initial load as complete once both conditions are met
  useEffect(() => {
    if (minTimeElapsed && !authLoading && !initialLoadComplete) {
      console.log('✅ [LOADING-PROVIDER] Initial load complete - will not show loading again');
      setInitialLoadComplete(true);
    }
  }, [minTimeElapsed, authLoading, initialLoadComplete]);

  // Log auth loading state changes
  useEffect(() => {
    console.log('🔐 [LOADING-PROVIDER] Auth loading state:', authLoading ? 'still loading...' : 'COMPLETE');
  }, [authLoading]);

  // CRITICAL FIX: Only show loading screen during INITIAL page load
  // Once initial load is complete, NEVER show loading screen again
  // This prevents blocking the signup success screen
  const showLoading = !initialLoadComplete && (!minTimeElapsed || authLoading);

  useEffect(() => {
    console.log(`[LOADING-PROVIDER] showLoading: ${showLoading}`);
    if (!showLoading) {
      console.log('✅ [LOADING-PROVIDER] Loading screen hiding');
    }
  }, [showLoading]);

  // Skip loader on /sites/ routes AND on subdomains (*.iamrunning.online)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isClientSite = pathname?.startsWith('/sites/') ||
    (hostname.includes('.iamrunning.online') && hostname !== 'iamrunning.online');
  if (isClientSite) return <>{children}</>;

  if (showLoading) {
    console.log('[LOADING-PROVIDER] ⏳ SHOWING LOADING SCREEN');
    return <LoadingScreen />;
  }

  console.log('[LOADING-PROVIDER] ✅ SHOWING CHILDREN');
  return <>{children}</>;
}


