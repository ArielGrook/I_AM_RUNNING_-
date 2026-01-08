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

// Singleton client instance to avoid multiple GoTrueClient instances
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Client-side Supabase client (browser)
 * Use in client components with SSR support
 * Returns singleton instance to avoid multiple client creation
 */
export function createSupabaseClient(cookieConsent?: 'accepted' | 'declined' | null) {
  // If no cookie consent provided, default to session storage (no persistence)
  const persistSession = cookieConsent === 'accepted';
  console.log('🔧 Creating/getting Supabase client with persistSession:', persistSession);

  // Return existing instance if available and persistence setting matches
  if (browserClientInstance) {
    console.log('🔄 Returning existing Supabase client instance');
    return browserClientInstance;
  }

  // Create new instance
  browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: true,
    },
  });

  console.log('🆕 Created new Supabase client instance');
  return browserClientInstance;
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


