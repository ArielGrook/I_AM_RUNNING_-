/**
 * Supabase Authentication Utilities
 * 
 * Authentication functions for admin and user roles.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Get a fresh Supabase client (no singleton)
 */
function getSupabaseClient() {
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
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: 'admin' | 'user';
  email?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  console.log('🔐 AUTH: Starting email/password sign in', { email });

  const supabase = getSupabaseClient();

  try {
    console.log('📡 AUTH: Calling Supabase signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('📡 AUTH: Supabase response received', { success: !error, user: data?.user?.email });

    if (error) {
      console.error('❌ AUTH: Sign in error:', error);
      throw new Error(error.message);
    }

    console.log('✅ AUTH: Sign in successful');
    return data;
  } catch (error) {
    console.error('❌ AUTH: Sign in exception:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 * Stores profile data in auth.users.user_metadata (no database query needed)
 */
export async function signUp(email: string, password: string, metadata?: Record<string, unknown>, locale?: string) {
  console.log('🔐 AUTH: Starting sign up', { email, metadata, locale });

  const supabase = getSupabaseClient();

  // Build complete metadata
  const userMetadata = {
    full_name: metadata?.full_name || metadata?.name || null,
    company: metadata?.company || null,
    role: 1, // Default: Free User
    ai_requests_today: 0,
    ai_requests_limit: 10,
  };

  console.log('📝 AUTH: Sending metadata:', userMetadata);

  try {
    console.log('📡 AUTH: Calling Supabase signUp...');
    
    // Production callback URL with locale (always use production for email links)
    // Default to 'en' if locale not provided
    const userLocale = locale || 'en';
    const emailRedirectTo = `https://iamrunning.online/${userLocale}/auth/callback`;
    
    console.log('📧 AUTH: Email redirect URL:', emailRedirectTo);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
        emailRedirectTo,
      },
    });

    console.log('📡 AUTH: Supabase response received', { success: !error, user: data?.user?.email });

    if (error) {
      console.error('❌ AUTH: Sign up error:', error);
      throw error;
    }

    console.log('✅ AUTH: Sign up successful:', {
      user_id: data.user?.id,
      email: data.user?.email,
      metadata: data.user?.user_metadata,
    });

    return data;
  } catch (error) {
    console.error('❌ AUTH: Sign up exception:', error);
    throw error;
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  console.log('🔐 AUTH: Starting Google OAuth sign in');

  const supabase = getSupabaseClient();

  try {
    console.log('📡 AUTH: Calling Supabase signInWithOAuth...');

    // Production callback URL
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://iamrunning.online/auth/callback';
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    console.log('📡 AUTH: OAuth initiation response', { success: !error });

    if (error) {
      console.error('❌ AUTH: Google OAuth error:', error);
      throw new Error(error.message);
    }

    console.log('✅ AUTH: Google OAuth initiated successfully');
    return data;
  } catch (error) {
    console.error('❌ AUTH: Google OAuth exception:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  console.log('🚪 AUTH: Starting sign out');

  const supabase = getSupabaseClient();

  try {
    console.log('📡 AUTH: Calling Supabase signOut...');

    const { error } = await supabase.auth.signOut();

    console.log('📡 AUTH: Sign out response received', { success: !error });

    if (error) {
      console.error('❌ AUTH: Sign out error:', error);
      throw new Error(error.message);
    }

    console.log('✅ AUTH: Sign out successful');
  } catch (error) {
    console.error('❌ AUTH: Sign out exception:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Check if user is admin (from user_metadata or separate admin table)
  const isAdmin = user.user_metadata?.role === 'admin' || 
                  user.email === process.env.ADMIN_EMAIL;

  return {
    ...user,
    role: isAdmin ? 'admin' : 'user',
    email: user.email,
  };
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Require admin access (throws if not admin)
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}








