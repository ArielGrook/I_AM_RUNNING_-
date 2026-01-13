'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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

type AuthContextValue = AuthState & {
  cookieConsent: 'accepted' | 'declined' | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateCookieConsent: (consent: 'accepted' | 'declined' | null) => void;
  hasRole: (requiredRole: number) => boolean;
  isAnonymous: boolean;
  isBasicUser: boolean;
  isFreelancer: boolean;
  isPremium: boolean;
  canAccessEditor: boolean;
  canAddComponents: boolean;
  canSaveProjects: boolean;
  getAILimit: () => number;
  getAIRequestsToday: () => number;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * useAuth hook for authentication and profile management
 */
function useAuthProvider(): AuthContextValue {
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
   * Load profile data from the profiles table (simplified - no timeout)
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
        return null;
      }
      
      console.log('✅ Profile loaded:', data);
      return data as Profile;
    } catch (error) {
      console.error('❌ Exception loading profile:', error);
      return null;
    }
  };

  /**
   * Create a profile record for a new user (simplified - no timeout)
   */
  const createProfile = async (user: User): Promise<Profile | null> => {
    try {
      console.log('📝 Creating profile for:', user.email);
      
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        company: user.user_metadata?.company || null,
        role: 1,
        ai_requests_today: 0,
        ai_requests_limit: 10,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        return null;
      }
      
      console.log('✅ Profile created:', data);
      return data as Profile;
    } catch (error) {
      console.error('❌ Exception creating profile:', error);
      return null;
    }
  };

  /**
   * Refresh authentication state (simplified)
   */
  const refreshAuth = async () => {
    console.log('🔄 Refreshing auth...');

    if (!mountedRef.current) return;

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Session error:', error);
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

      if (user) {
        let profile = await loadProfile(user.id);
        if (!profile) profile = await createProfile(user);
        
        // Use default if still null
        if (!profile) {
          profile = {
            id: user.id,
            email: user.email || '',
            role: 1,
            ai_requests_today: 0,
            ai_requests_limit: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile;
        }

        if (mountedRef.current) {
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
      console.error('❌ Refresh auth error:', error);
      if (mountedRef.current) {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
          error: error instanceof Error ? error.message : 'Auth error',
        });
      }
    }
  };

  /**
   * Sign in with email and password
   */
  const signInUser = async (email: string, password: string) => {
    console.log('🔐 Sign in:', email);
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await signIn(email, password);
      console.log('✅ Sign in successful:', result?.user?.email);
      // Auth listener will handle state update
    } catch (error) {
      console.error('❌ Sign in failed:', error);
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
    console.log('🔐 Sign up:', email);
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await signUp(email, password, metadata);
      console.log('✅ Sign up successful:', result?.user?.email);
      // Auth listener will handle state update
    } catch (error) {
      console.error('❌ Sign up failed:', error);
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
    console.log('🔐 Google sign in...');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await signInWithGoogle();
      console.log('✅ Google OAuth initiated:', result);
      // User will be redirected, clear loading after 2s if blocked
      setTimeout(() => {
        if (mountedRef.current) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
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
    console.log('🚪 Sign out...');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await signOut();
      console.log('✅ Signed out');
      if (mountedRef.current) {
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
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Sign out failed'
        }));
      }
      throw error;
    }
  };

  // Listen for auth state changes (simplified - no timeouts)
  useEffect(() => {
    console.log('🎧 Auth: Starting...');
    mountedRef.current = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Session found:', session.user.email);
          
          let profile = await loadProfile(session.user.id);
          if (!profile) {
            profile = await createProfile(session.user);
          }
          
          // Use default if still null
          if (!profile) {
            profile = {
              id: session.user.id,
              email: session.user.email || '',
              role: 1,
              ai_requests_today: 0,
              ai_requests_limit: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Profile;
          }
          
          if (mountedRef.current) {
            setAuthState({
              user: session.user,
              profile,
              loading: false,
              isAuthenticated: true,
              error: null,
            });
          }
        } else {
          console.log('ℹ️ No session');
          if (mountedRef.current) {
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
        console.error('❌ Init auth error:', error);
        if (mountedRef.current) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event);
        
        if (!mountedRef.current) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const user = session?.user;
          if (user) {
            let profile = await loadProfile(user.id);
            if (!profile) {
              profile = await createProfile(user);
            }
            if (!profile) {
              profile = {
                id: user.id,
                email: user.email || '',
                role: 1,
                ai_requests_today: 0,
                ai_requests_limit: 10,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as Profile;
            }
            
            setAuthState({
              user,
              profile,
              loading: false,
              isAuthenticated: true,
              error: null,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Role-based access helpers
  const role = authState.profile?.role ?? -1;
  const hasRole = (requiredRole: number): boolean => role >= requiredRole;

  const isAnonymous = role === 0;
  const isBasicUser = role >= 1;
  const isFreelancer = role >= 2;
  const isPremium = role >= 3;

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

/**
 * AuthProvider ensures a single shared auth instance across the app.
 * This prevents multiple timers/listeners from being created by each consumer.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthProvider();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Consumer hook for shared auth state/actions
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

