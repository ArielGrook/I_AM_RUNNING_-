/**
 * Supabase Authentication Utilities
 * 
 * Authentication functions for admin and user roles.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

import { createSupabaseClient } from './client';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: 'admin' | 'user';
  email?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createSupabaseClient();
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








