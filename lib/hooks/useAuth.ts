'use client';

import { useEffect, useState, useMemo } from 'react';
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
    loading: true,
    isAuthenticated: false,
    error: null,
  });

  // Check cookie consent synchronously
  const cookieConsent = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const storedConsent = localStorage.getItem('cookie-consent');
    return storedConsent === 'accepted' || storedConsent === 'declined'
      ? (storedConsent as 'accepted' | 'declined')
      : null;
  }, []);

  console.log('🍪 Current cookie consent:', cookieConsent);

  const supabase = useMemo(() => createSupabaseClient(cookieConsent), [cookieConsent]);

  /**
   * Update cookie consent and reinitialize auth client
   */
  const updateCookieConsent = (consent: 'accepted' | 'declined' | null) => {
    console.log('🍪 Updating cookie consent to:', consent);
    localStorage.setItem('cookie-consent', consent || '');
    // Force a page reload to reinitialize with new cookie consent
    window.location.reload();
  };

  /**
   * Load profile data from the profiles table
   */
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  };

  /**
   * Create a profile record for a new user
   */
  const createProfile = async (user: User): Promise<Profile | null> => {
    try {
      const profileData: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name,
        company: user.user_metadata?.company,
        role: 1, // Default to basic user
        ai_requests_today: 0,
        ai_requests_limit: 10,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  /**
   * Refresh authentication state
   */
  const refreshAuth = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      const user = session?.user;

      if (error) {
        console.error('Auth error:', error);
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
          error: error.message,
        });
        return;
      }

      if (user) {
        // Load or create profile
        let profile = await loadProfile(user.id);
        if (!profile) {
          // Profile doesn't exist, create one
          profile = await createProfile(user);
        }

        setAuthState({
          user,
          profile,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      });
    }
  };

  /**
   * Sign in with email and password
   */
  const signInUser = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await signIn(email, password);
      // Auth state will be updated by the listener
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  /**
   * Sign up with email and password
   */
  const signUpUser = async (email: string, password: string, metadata?: Record<string, any>) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await signUp(email, password, metadata);
      // Auth state will be updated by the listener
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogleUser = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await signInWithGoogle();
      // Auth state will be updated by the listener
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  /**
   * Sign out current user
   */
  const signOutUser = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await signOut();
      // Auth state will be updated by the listener
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    // Initial auth check
    refreshAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event);
        console.log('👤 User:', session?.user?.email);
        console.log('🎫 Session:', session ? 'exists' : 'null');
        console.log('🔑 Access token:', session?.access_token ? 'present' : 'missing');

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in, loading profile...');
          let profile = await loadProfile(session.user.id);
          if (!profile) {
            console.log('📝 Creating new profile for user...');
            // Create profile for new user
            profile = await createProfile(session.user);
          }

          console.log('✅ Profile loaded:', profile);
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            isAuthenticated: true,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out');
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed, reloading profile...');
          // User session refreshed, reload profile
          const profile = await loadProfile(session.user.id);
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            profile: profile || prev.profile,
            loading: false,
            isAuthenticated: true,
            error: null,
          }));
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('👤 User updated');
          const profile = await loadProfile(session.user.id);
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            profile: profile || prev.profile,
            loading: false,
            isAuthenticated: true,
            error: null,
          }));
        }
      }
    );

    return () => {
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

