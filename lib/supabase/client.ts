/**
 * Supabase Client Configuration
 * 
 * Creates and exports Supabase client instances for:
 * - Server-side operations (API routes, server components)
 * - Client-side operations (browser)
 * 
 * Fixes Critical Error #5 from BIG REVIEW.md
 */

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Server-side Supabase client
 * Use in API routes and server components
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Server-side doesn't persist sessions
  },
});

/**
 * Client-side Supabase client (browser)
 * Use in client components with SSR support
 */
export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get Supabase client for current context
 * Automatically detects server vs client
 */
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side
    return supabase;
  } else {
    // Client-side
    return createSupabaseClient();
  }
}


