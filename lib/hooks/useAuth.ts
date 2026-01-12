'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase/client';
import { signIn, signUp, signOut, signInWithGoogle } from '@/lib/supabase/auth';

/**
 * Profile interface matching our database schema
 */
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role: number; // 0=anon, 1=basic, 2=freelancer, 3=premium
  ai_requests_today: number;
  ai_requests_limit: number;
  subscription_expires?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Auth state interface
 */
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * useAuth hook for authentication and profile management
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true, // Start with loading true to check initial auth state
    isAuthenticated: false,
    error: null,
  });

  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'declined' | null>(() => {
    // Initialize from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cookie-consent');
      return stored as 'accepted' | 'declined' | null || null;
    }
    return null;
  });
  const mountedRef = useRef(true);
  const authTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clear the in-flight auth timeout (no-op if none exists)
   */
  const clearAuthTimeout = () => {
    if (authTimeoutRef.current !== null) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
  };

  /**
   * Arm the auth timeout and make sure no stale timer can fire later.
   * Any previously scheduled timer is cleared before setting a new one.
   */
  const startAuthTimeout = () => {
    // Prevent orphaned timers if refreshAuth is called multiple times
    clearAuthTimeout();

    const timeoutId = setTimeout(() => {
      // Bail out if this timer has been cleared/replaced or the component is gone
      if (!mountedRef.current || authTimeoutRef.current !== timeoutId) return;

      console.log('⏰ Auth refresh timeout');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Authentication request timed out. Please try again.'
      }));
    }, 15000); // 15 second timeout

    authTimeoutRef.current = timeoutId;
  };

  // Create Supabase client once
  const supabase = useMemo(() => {
    const consent = typeof window !== 'undefined' ? localStorage.getItem('cookie-consent') as 'accepted' | 'declined' | null : null;
    console.log('🔧 Creating Supabase client with cookieConsent:', consent);
    return createSupabaseClient(consent);
  }, []);

  /**
   * Update cookie consent
   */
  const updateCookieConsent = (consent: 'accepted' | 'declined' | null) => {
    console.log('🍪 Updating cookie consent to:', consent);
    setCookieConsent(consent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent', consent || '');
    }
    // Note: Persistence change requires page reload
  };

  /**
   * Load profile data from the profiles table
   */
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('🔍 Loading profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error);
        console.log('🔍 Profile load response:', { data, error });
        return null;
      }

      console.log('✅ Profile loaded successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception loading profile:', error);
      return null;
    }
  };

  /**
   * Create a profile record for a new user
   */
  const createProfile = async (user: User): Promise<Profile | null> => {
    try {
      console.log('🏗️ Creating profile for user:', user.email);

      const profileData: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name,
        company: user.user_metadata?.company,
        role: 1, // Default to basic user
        ai_requests_today: 0,
        ai_requests_limit: 10,
      };

      console.log('📝 Profile creation data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        console.log('🏗️ Profile creation response:', { data, error });
        return null;
      }

      console.log('✅ Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception creating profile:', error);
      return null;
    }
  };

  /**
   * Refresh authentication state
   */
  const refreshAuth = async () => {
    console.log('🔄 Refreshing auth state...');

    if (!mountedRef.current) {
      console.log('🚫 Component unmounted, skipping auth refresh');
      return;
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    // Set timeout to prevent infinite loading
    startAuthTimeout();

    try {
      console.log('🔍 Getting current session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      // Always clear timeout when getSession() resolves (success or error)
      // This prevents timeout from firing after we've already handled the response
      clearAuthTimeout();

      console.log('🔐 Session check result:', { hasSession: !!session, error: error?.message });

      if (error) {
        console.error('❌ Auth session error:', error);
        if (mountedRef.current) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
            error: error.message,
          });
        }
        return;
      }

      const user = session?.user;
      console.log('👤 User from session:', user?.email || 'none');

      if (user) {
        console.log('🔍 Loading/creating profile for authenticated user...');
        // Load or create profile
        let profile = await loadProfile(user.id);
        if (!profile) {
          console.log('🏗️ Profile not found, creating new profile...');
          // Profile doesn't exist, create one
          profile = await createProfile(user);
        }

        if (mountedRef.current) {
          console.log('✅ Auth state updated - user authenticated');
          setAuthState({
            user,
            profile,
            loading: false,
            isAuthenticated: true,
            error: null,
          });
        }
      } else {
        if (mountedRef.current) {
          console.log('👤 No authenticated user');
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      }
    } catch (error) {
      clearAuthTimeout();

      console.error('❌ Exception refreshing auth:', error);
      if (mountedRef.current) {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
          error: error instanceof Error ? error.message : 'Authentication error',
        });
      }
    }
  };

  /**
   * Sign in with email and password
   */
  const signInUser = async (email: string, password: string) => {
    console.log('🔐 Starting email/password sign in process', { email });
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📤 Calling Supabase signIn function...');
      const result = await signIn(email, password);
      console.log('✅ Sign in API call successful:', { user: result?.user?.email });

      // Don't use setTimeout to clear loading - let the auth state change listener handle it
      // Loading will be cleared when:
      // 1. Auth listener detects SIGNED_IN event (success) - sets loading: false
      // 2. Error occurs (catch block below) - sets loading: false
      // This prevents race conditions between setTimeout and auth listener
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      
      // CRITICAL: Clear any pending timeout to prevent it from overwriting this error
      if (authTimeoutRef.current) {
        console.log('🧹 Clearing auth timeout after sign-in error');
      }
      clearAuthTimeout();
      
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }
      throw error;
    }
  };

  /**
   * Sign up with email and password
   */
  const signUpUser = async (email: string, password: string, metadata?: Record<string, any>) => {
    console.log('🔐 Starting email/password sign up process', { email, metadata });
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📤 Calling Supabase signUp function...');
      const result = await signUp(email, password, metadata);
      console.log('✅ Sign up API call successful:', { user: result?.user?.email });

      // Don't use setTimeout - let the auth state change listener handle loading state
      // Loading will be cleared when listener detects SIGNED_IN event
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      
      // CRITICAL: Clear any pending timeout to prevent it from overwriting this error
      clearAuthTimeout();
      
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }
      throw error;
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogleUser = async () => {
    console.log('🔐 Starting Google OAuth sign in process');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📤 Calling Supabase signInWithGoogle function...');
      const result = await signInWithGoogle();
      console.log('✅ Google sign in initiated:', result);

      // For OAuth, user will be redirected away from page
      // Clear loading after 2s in case redirect doesn't happen (popup blocked, etc.)
      // This is different from email/password auth which doesn't redirect
      setTimeout(() => {
        if (mountedRef.current) {
          console.log('🔄 Clearing loading state - OAuth redirect may have been blocked');
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      
      // CRITICAL: Clear any pending timeout to prevent it from overwriting this error
      clearAuthTimeout();
      
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }
      throw error;
    }
  };

  /**
   * Sign out current user
   */
  const signOutUser = async () => {
    console.log('🚪 Starting sign out process');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📤 Calling Supabase signOut function...');
      await signOut();
      console.log('✅ Sign out API call successful');

      // Immediately clear auth state since sign out is synchronous
      if (mountedRef.current) {
        console.log('🔄 Clearing auth state after sign out');
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('🎧 Setting up auth state listener...');
    mountedRef.current = true;

    // Initial auth check
    if (mountedRef.current) {
      console.log('🔍 Performing initial auth check...');
      refreshAuth();
    }

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change event:', event, 'User:', session?.user?.email || 'none');

        if (!mountedRef.current) {
          console.log('🚫 Component unmounted, ignoring auth event');
          return;
        }

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('✅ User signed in or token refreshed');
            const user = session?.user;
            if (user) {
              // Load or create profile
              let profile = await loadProfile(user.id);
              if (!profile) {
                console.log('🏗️ Creating profile for new user...');
                profile = await createProfile(user);
              }

              setAuthState({
                user,
                profile,
                loading: false,
                isAuthenticated: true,
                error: null,
              });
              console.log('✅ Auth state updated - user authenticated');
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out');
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              isAuthenticated: false,
              error: null,
            });
          } else if (event === 'USER_UPDATED') {
            console.log('👤 User updated');
            const user = session?.user;
            if (user && authState.isAuthenticated) {
              // Update user data but keep existing profile
              setAuthState(prev => ({
                ...prev,
                user,
                loading: false,
              }));
            }
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Auth state update failed',
          }));
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener...');
      mountedRef.current = false;
      clearAuthTimeout();
      subscription.unsubscribe();
    };
  }, []);

  // Role-based access helpers
  const hasRole = (requiredRole: number): boolean => {
    return authState.profile?.role >= requiredRole;
  };

  const isAnonymous = authState.profile?.role === 0;
  const isBasicUser = authState.profile?.role >= 1;
  const isFreelancer = authState.profile?.role >= 2;
  const isPremium = authState.profile?.role >= 3;

  const canAccessEditor = isBasicUser;
  const canAddComponents = isBasicUser;
  const canSaveProjects = isBasicUser;
  const getAILimit = (): number => authState.profile?.ai_requests_limit || 0;
  const getAIRequestsToday = (): number => authState.profile?.ai_requests_today || 0;

  return {
    // Auth state
    ...authState,

    // Cookie consent
    cookieConsent,

    // Actions
    signIn: signInUser,
    signUp: signUpUser,
    signInWithGoogle: signInWithGoogleUser,
    signOut: signOutUser,
    refreshAuth,
    updateCookieConsent,

    // Role-based access
    hasRole,
    isAnonymous,
    isBasicUser,
    isFreelancer,
    isPremium,

    // Feature access
    canAccessEditor,
    canAddComponents,
    canSaveProjects,
    getAILimit,
    getAIRequestsToday,
  };
}

