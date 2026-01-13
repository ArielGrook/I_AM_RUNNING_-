'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
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
 * Create a fresh Supabase client (no singleton, no caching)
 */
function createFreshSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const cookieConsent = typeof window !== 'undefined' 
    ? localStorage.getItem('cookie-consent') as 'accepted' | 'declined' | null
    : null;

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: cookieConsent === 'accepted',
      autoRefreshToken: cookieConsent === 'accepted',
      detectSessionInUrl: true,
    },
  });
}

/**
 * Timeout wrapper for promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Load profile with timeout and fallback
 */
async function loadProfile(userId: string): Promise<Profile | null> {
  console.log('🔍 Loading profile for user:', userId);
  
  const supabase = createFreshSupabaseClient();
  
  try {
    // Try to load profile with 3 second timeout
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const result = await withTimeout(
      queryPromise,
      3000,
      'Profile query timeout after 3 seconds'
    );

    if (result.error) {
      console.error('❌ Profile query error:', result.error);
      return null;
    }

    if (result.data) {
      console.log('✅ Profile loaded successfully:', result.data);
      return result.data as Profile;
    }

    console.warn('⚠️ Profile query returned no data');
    return null;
  } catch (error) {
    console.error('❌ Profile load failed:', error);
    return null;
  }
}

/**
 * useAuth hook for authentication and profile management
 */
function useAuthProvider(): AuthContextValue {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
    error: null,
  });

  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'declined' | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cookie-consent') as 'accepted' | 'declined' | null || null;
    }
    return null;
  });

  const mountedRef = useRef(true);
  const initDoneRef = useRef(false);

  /**
   * Update cookie consent
   */
  const updateCookieConsent = (consent: 'accepted' | 'declined' | null) => {
    console.log('🍪 Updating cookie consent to:', consent);
    setCookieConsent(consent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent', consent || '');
    }
  };

  /**
   * Refresh authentication state
   */
  const refreshAuth = async () => {
    if (!mountedRef.current) return;

    console.log('🔄 Refreshing auth...');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const supabase = createFreshSupabaseClient();
      
      // Get session with timeout
      const sessionPromise = supabase.auth.getSession();
      const { data: { session }, error } = await withTimeout(
        sessionPromise,
        2000,
        'Session check timeout'
      );

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
        // Try to load profile, but don't wait forever
        const profile = await loadProfile(user.id);
        
        if (mountedRef.current) {
          if (profile) {
            setAuthState({
              user,
              profile,
              loading: false,
              isAuthenticated: true,
              error: null,
            });
          } else {
            // Fallback to default profile if query fails
            console.warn('⚠️ Using fallback profile');
            setAuthState({
              user,
              profile: {
                id: user.id,
                email: user.email || '',
                role: 1,
                ai_requests_today: 0,
                ai_requests_limit: 10,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as Profile,
              loading: false,
              isAuthenticated: true,
              error: null,
            });
          }
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
      await signIn(email, password);
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
      await signUp(email, password, metadata);
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
      await signInWithGoogle();
      // User will be redirected
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

  // Initialize auth state once on mount
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    mountedRef.current = true;
    console.log('🎧 Auth: Initializing...');

    const initAuth = async () => {
      try {
        const supabase = createFreshSupabaseClient();
        
        // Get session with timeout
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await withTimeout(
          sessionPromise,
          2000,
          'Initial session check timeout'
        );

        if (session?.user) {
          console.log('✅ Session found:', session.user.email);
          
          // Try to load profile, but don't block on it
          const profile = await loadProfile(session.user.id);
          
          if (mountedRef.current) {
            if (profile) {
              setAuthState({
                user: session.user,
                profile,
                loading: false,
                isAuthenticated: true,
                error: null,
              });
            } else {
              // Use fallback profile immediately
              console.warn('⚠️ Using fallback profile (query failed or timed out)');
              setAuthState({
                user: session.user,
                profile: {
                  id: session.user.id,
                  email: session.user.email || '',
                  role: 1,
                  ai_requests_today: 0,
                  ai_requests_limit: 10,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as Profile,
                loading: false,
                isAuthenticated: true,
                error: null,
              });
            }
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

    // Listen for auth state changes
    const supabase = createFreshSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event);
        
        if (!mountedRef.current) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const user = session?.user;
          if (user) {
            // Try to load profile, but use fallback if it fails
            const profile = await loadProfile(user.id);
            
            setAuthState({
              user,
              profile: profile || {
                id: user.id,
                email: user.email || '',
                role: 1,
                ai_requests_today: 0,
                ai_requests_limit: 10,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as Profile,
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
