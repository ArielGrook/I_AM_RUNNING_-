/**
 * Supabase Authentication Utilities
 * 
 * Authentication functions for admin and user roles.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

import { getSupabaseClient } from './client';
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

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sign in request timed out')), 10000);
    });

    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

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
 */
export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  console.log('🔐 AUTH: Starting email/password sign up', { email, metadata });

  const supabase = getSupabaseClient();

  try {
    console.log('📡 AUTH: Calling Supabase signUp...');

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sign up request timed out')), 10000);
    });

    const authPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        email_confirm: false, // Skip email verification
      } as any,
    });

    const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

    console.log('📡 AUTH: Supabase response received', { success: !error, user: data?.user?.email });

    if (error) {
      console.error('❌ AUTH: Sign up error:', error);
      throw new Error(error.message);
    }

    console.log('✅ AUTH: Sign up successful');
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

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
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








