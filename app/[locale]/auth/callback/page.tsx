'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
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
            console.warn('⚠️ Exchange returned error, checking session anyway:', exchangeError);
          }

          // Verify session even if exchange reported an error
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('❌ Session check failed:', sessionError);
            setStatus('error');
            return;
          }

          if (sessionData?.session?.user) {
            console.log('✅ Email confirmed! Session present.');
            setStatus('success');
          } else {
            console.error('❌ No session after code exchange');
            setStatus('error');
          }
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Callback error:', err);
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams]);

  const getText = () => {
    if (locale === 'ru') {
      return {
        loading: 'Подтверждаем email...',
        success: 'Ваша почта подтверждена',
        error: 'Ошибка подтверждения',
        button: 'НАЧАТЬ',
      };
    } else if (locale === 'he') {
      return {
        loading: 'מאשרים אימייל...',
        success: 'האימייל שלך אושר בהצלחה',
        error: 'שגיאת אישור',
        button: 'להתחיל לרוץ',
      };
    } else {
      return {
        loading: 'Confirming email...',
        success: 'Your email was successfully confirmed',
        error: 'Confirmation failed',
        button: 'START RUNNING',
      };
    }
  };

  const text = getText();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full text-center space-y-8 px-4">
        {/* Logo */}
        <div className="flex items-center justify-center mb-12">
          <div className="text-4xl font-bold text-[#ffa500]">I AM RUNNING</div>
        </div>

        {status === 'loading' && (
          <div className="space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ffa500] border-t-transparent mx-auto"></div>
            <p className="text-xl text-gray-900">{text.loading}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            {/* Success checkmark */}
            <div className="mx-auto w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Success text */}
            <h1 className="text-3xl font-bold text-gray-900">
              {text.success}
            </h1>

            {/* START RUNNING button */}
            <button
              onClick={() => router.push('/')}
              className="w-full max-w-xs mx-auto px-8 py-4 bg-[#ffa500] text-white text-lg font-bold rounded-full hover:bg-[#ff8c00] transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {text.button}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            {/* Error icon */}
            <div className="mx-auto w-24 h-24 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            {/* Error text */}
            <h1 className="text-3xl font-bold text-gray-900">
              {text.error}
            </h1>

            {/* Back button */}
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full max-w-xs mx-auto px-8 py-4 bg-[#ffa500] text-white text-lg font-bold rounded-full hover:bg-[#ff8c00] transition-all"
            >
              {locale === 'ru' ? 'Назад' : locale === 'he' ? 'חזרה' : 'Back to Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

