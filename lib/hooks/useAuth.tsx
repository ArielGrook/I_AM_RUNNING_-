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
  role: number; // 0=anon, 1=Free User, 2=Paid User, 3=Freelancer Basic, 4=Freelancer Pro, 5=Admin
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
  signUp: (email: string, password: string, metadata?: Record<string, any>, locale?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateCookieConsent: (consent: 'accepted' | 'declined' | null) => void;
  // Role system (5-tier)
  role: number;
  hasRole: (requiredRole: number) => boolean;
  isAnonymous: boolean;
  isRegistered: boolean;
  isBasicUser: boolean;
  isFreelancer: boolean;
  isProFreelancer: boolean;
  isAdmin: boolean;
  // Feature access
  canUseChat: boolean;
  canAccessEditor: boolean;
  canCreateWebsites: boolean;
  canAddComponents: boolean;
  canSaveProjects: boolean;
  hasUnlimitedProjects: boolean;
  getProjectLimit: () => number;
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
 * Build profile from auth user metadata (NO database query)
 * Profile data is stored in auth.users.user_metadata for fast access
 */
function buildProfileFromUser(user: User): Profile {
  console.log('🔧 Building profile from user metadata:', user.email);
  
  const metadata = user.user_metadata || {};
  
  const profile: Profile = {
    id: user.id,
    email: user.email || '',
    full_name: metadata.full_name || metadata.name || null,
    company: metadata.company || null,
    role: metadata.role ?? 1, // Default: Free User
    ai_requests_today: metadata.ai_requests_today ?? 0,
    ai_requests_limit: metadata.ai_requests_limit ?? 10,
    created_at: user.created_at,
    updated_at: new Date().toISOString(),
  };
  
  console.log('✅ Profile built from metadata:', profile);
  return profile;
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
      
      // Get session (no timeout needed - Supabase handles this)
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
        // Build profile from user metadata (instant, no database query)
        const profile = buildProfileFromUser(user);
        
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
  const signUpUser = async (email: string, password: string, metadata?: Record<string, any>, locale?: string) => {
    console.log('🔐 Sign up:', email, 'locale:', locale);
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await signUp(email, password, metadata, locale);
      // Signup successful - clear loading state immediately
      // (User will confirm email later, which will trigger SIGNED_IN event)
      console.log('✅ Signup successful, clearing loading state');
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null
        }));
      }
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
        
        // Get session (no timeout needed - Supabase handles this)
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

        if (session?.user) {
          console.log('✅ Session found:', session.user.email);
          
          // Build profile from user metadata (instant, no database query)
          const profile = buildProfileFromUser(session.user);
          
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

    // Listen for auth state changes
    const supabase = createFreshSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event);
        
        if (!mountedRef.current) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          
          console.log('🔐 Auth event: SIGNED_IN');
          console.log('👤 User data:', { email: user.email, metadata: user.user_metadata });
          
          // Build profile from user metadata (fast, cached by Supabase)
          const profile = buildProfileFromUser(user);
          
          console.log('📋 Profile built from metadata:', { email: profile.email, role: profile.role });
          
          setAuthState({
            user,
            profile,
            loading: false,
            isAuthenticated: true,
            error: null,
          });
          
          console.log('✅ Auth state updated');
        } else if (event === 'TOKEN_REFRESHED') {
          // For token refresh, use cached session (no need to hit server again)
          console.log('🔐 Auth event: TOKEN_REFRESHED');
          const user = session?.user;
          
          if (user) {
            console.log('👤 User data (from cache):', {
              id: user.id,
              email: user.email,
              metadata: user.user_metadata,
            });
            
            const profile = buildProfileFromUser(user);
            
            console.log('📋 Built profile:', profile);
            
            setAuthState({
              user,
              profile,
              loading: false,
              isAuthenticated: true,
              error: null,
            });
            
            console.log('✅ Auth state updated');
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

  // 5-Tier Role-Based Access System
  // role: 0 = Anonymous (not logged in)
  // role: 1 = Free User (Chat only, no editor)
  // role: 2 = Paid User ($20 one-time) - Chat + Editor, 1 project limit
  // role: 3 = Freelancer Basic ($30/month) - Full features, 5 projects
  // role: 4 = Freelancer Pro ($100/month) - Unlimited projects + priority
  // role: 5 = Admin - Full access to everything
  
  const role = authState.profile?.role ?? (authState.isAuthenticated ? 1 : 0);
  const hasRole = (requiredRole: number): boolean => role >= requiredRole;

  // Access levels
  const isAnonymous = role === 0;
  const isRegistered = role >= 1;          // Can use chat
  const isBasicUser = role >= 1;           // Free user (backward compat)
  const canAccessEditor = role >= 2;       // Can create websites
  const isFreelancer = role >= 3;          // Monthly subscriber
  const isProFreelancer = role >= 4;       // Premium tier
  const isAdmin = role >= 5;               // Full access

  // Debug logging (only log when auth state changes)
  useEffect(() => {
    if (!authState.loading && authState.isAuthenticated) {
      console.log('🔐 Auth state:', {
        role,
        canAccessEditor,
        isAuthenticated: authState.isAuthenticated,
        profileRole: authState.profile?.role,
      });
    }
  }, [role, canAccessEditor, authState.isAuthenticated, authState.loading, authState.profile?.role]);

  // Feature flags
  const canUseChat = isRegistered && authState.isAuthenticated;
  const canCreateWebsites = canAccessEditor && authState.isAuthenticated;
  const hasUnlimitedProjects = role >= 4;
  const canAddComponents = canAccessEditor;
  const canSaveProjects = canAccessEditor;

  // Project limits
  const getProjectLimit = (): number => {
    if (role === 2) return 1;      // Paid User: 1 project
    if (role === 3) return 5;      // Freelancer Basic: 5 projects
    if (role >= 4) return 999;     // Pro/Admin: Unlimited (999 = practical unlimited)
    return 0;                       // Free/Anonymous: No projects
  };

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

    // Role system (5-tier)
    role,
    hasRole,
    isAnonymous,
    isRegistered,
    isBasicUser,
    isFreelancer,
    isProFreelancer,
    isAdmin,

    // Feature access
    canUseChat,
    canAccessEditor,
    canCreateWebsites,
    canAddComponents,
    canSaveProjects,
    hasUnlimitedProjects,
    getProjectLimit,
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
