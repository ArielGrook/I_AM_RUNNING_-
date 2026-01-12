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
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Get Supabase client (singleton in browser, server client on server)
 */
export function getSupabaseClient(cookieConsent?: 'accepted' | 'declined' | null) {
  // Server-side: return non-persisted client
  if (typeof window === 'undefined') {
    return supabase;
  }

  if (supabaseInstance) {
    console.log('🔄 Returning existing Supabase client instance');
    return supabaseInstance;
  }

  console.log('🆕 Creating new Supabase client instance');
  const persistSession = cookieConsent === 'accepted';

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession,
        autoRefreshToken: persistSession,
        detectSessionInUrl: true,
      },
    }
  );

  return supabaseInstance;
}

/**
 * Backward compatibility wrapper
 */
export function createSupabaseClient(cookieConsent?: 'accepted' | 'declined' | null) {
  return getSupabaseClient(cookieConsent);
}


