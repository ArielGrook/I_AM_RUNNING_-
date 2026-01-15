'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 Auth callback: Confirming email...');
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
            },
          }
        );

        const code = searchParams?.get('code');
        const error = searchParams?.get('error');

        if (error) {
          console.error('❌ Callback error:', error);
          setStatus('error');
          return;
        }

        if (code) {
          console.log('🔑 Exchanging code for session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('❌ Exchange failed:', exchangeError);
            setStatus('error');
            return;
          }

          console.log('✅ Email confirmed! Redirecting...');
          setStatus('success');
          setTimeout(() => router.push('/chat'), 2000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Callback error:', err);
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Confirming Email...</h2>
            <p className="text-gray-600">Please wait</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Email Confirmed!</h2>
            <p className="text-gray-600">Redirecting to chat...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Confirmation Failed</h2>
            <p className="text-gray-600 mb-4">Please try again or contact support</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

