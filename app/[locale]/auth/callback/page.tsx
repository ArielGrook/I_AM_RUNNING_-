'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Test on multiple devices/countries: signup → email link → callback.
      // Check Supabase logs for errors.
      try {
        // Diagnostic logging: Capture device and environment info
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
        const allParams: Record<string, string | null> = {};
        if (searchParams) {
          searchParams.forEach((value, key) => {
            allParams[key] = value;
          });
        }

        console.log('🔐 Auth callback: Starting confirmation...', {
          userAgent,
          isMobile,
          allParams,
          codeLength: searchParams?.get('code')?.length || 0,
          hasCode: !!searchParams?.get('code'),
          hasError: !!searchParams?.get('error'),
          timestamp: new Date().toISOString(),
        });
        
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

        // Check for initial session before any exchange (mobile fallback)
        console.log('📱 Checking initial session (mobile fallback)...');
        const { data: initialSession } = await supabase.auth.getSession();
        if (initialSession?.session?.user) {
          console.log('✅ Initial session found before exchange:', {
            userId: initialSession.session.user.id,
            email: initialSession.session.user.email,
          });
        }

        const code = searchParams?.get('code');
        const error = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');
        const accessToken = searchParams?.get('access_token');
        const authType = searchParams?.get('type');

        const isOAuthFlow = Boolean(accessToken || authType === 'recovery' || code);

        if (error) {
          const messageSource = errorDescription || error;
          const normalized = messageSource.toLowerCase();
          const friendlyMessage = normalized.includes('account exists with different credential')
            ? 'Account exists. Link Google in settings?'
            : 'OAuth failed';
          console.error('❌ Callback error in URL params:', {
            error,
            errorDescription,
            allParams,
            userAgent,
            isMobile,
          });
          
          // Even with error param, check if session exists (mobile edge case)
          const { data: errorSessionCheck } = await supabase.auth.getSession();
          if (errorSessionCheck?.session?.user) {
            console.log('✅ Session exists despite error param - forcing success');
            const user = errorSessionCheck.session.user;
            const providers = user.app_metadata?.providers || [];
            const isGoogleProvider = user.app_metadata?.provider === 'google' || providers.includes('google');
            setIsGoogleAuth(isGoogleProvider);
            setStatus('success');
            return;
          }
          
          setErrorMessage(friendlyMessage);
          setStatus('error');
          return;
        }

        if (isOAuthFlow) {
          console.log('🔑 Exchanging code for session...', {
            codeLength: code?.length || 0,
            hasCode: !!code,
            isMobile,
          });
          
          let exchangeError = null;
          if (code) {
            const { error: err } = await supabase.auth.exchangeCodeForSession(code);
            exchangeError = err;
            
            console.log('📡 Exchange response:', {
              hasError: !!err,
              errorMessage: err?.message,
              errorCode: err?.status,
            });

            if (err) {
              console.warn('⚠️ Exchange returned error, checking session anyway:', {
                error: err.message,
                code: err.status,
                isMobile,
                userAgent,
              });
            }
          }

          // CRITICAL: Always verify session even if exchange reported an error
          // Mobile devices may have session established despite exchange error
          console.log('🔍 Verifying session after exchange...');
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          console.log('📊 Session check result:', {
            hasSession: !!sessionData?.session,
            hasUser: !!sessionData?.session?.user,
            userId: sessionData?.session?.user?.id,
            email: sessionData?.session?.user?.email,
            sessionError: sessionError?.message,
            isMobile,
          });

          // Retry session check if first attempt fails (mobile cookie delay)
          if (!sessionData?.session?.user && isMobile) {
            console.log('🔄 Retrying session check (mobile delay)...');
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session?.user) {
              console.log('✅ Session found on retry');
              const user = retrySession.session.user;
              const providers = user.app_metadata?.providers || [];
              const isGoogleProvider = user.app_metadata?.provider === 'google' || providers.includes('google');
              setIsGoogleAuth(isGoogleProvider);

              if (user.user_metadata?.role == null) {
                const { error: updateError } = await supabase.auth.updateUser({
                  data: { role: 1 },
                });
                if (updateError) {
                  console.warn('⚠️ Failed to set default role metadata:', updateError);
                }
              }

              console.log('✅ Email confirmed! Session present (retry).');
              setStatus('success');
              return;
            }
          }

          if (sessionData?.session?.user) {
            const user = sessionData.session.user;
            const providers = user.app_metadata?.providers || [];
            const isGoogleProvider = user.app_metadata?.provider === 'google' || providers.includes('google');
            setIsGoogleAuth(isGoogleProvider);

            if (user.user_metadata?.role == null) {
              const { error: updateError } = await supabase.auth.updateUser({
                data: { role: 1 },
              });
              if (updateError) {
                console.warn('⚠️ Failed to set default role metadata:', updateError);
              }
            }

            console.log('✅ Email confirmed! Session present.', {
              userId: user.id,
              email: user.email,
              isGoogle: isGoogleProvider,
              isMobile,
            });
            setStatus('success');
          } else {
            console.error('❌ No session after code exchange', {
              exchangeError: exchangeError?.message,
              sessionError: sessionError?.message,
              isMobile,
              userAgent,
              allParams,
            });
            setErrorMessage('OAuth failed');
            setStatus('error');
          }
        } else {
          console.error('❌ Not an OAuth flow', { allParams });
          setErrorMessage('OAuth failed');
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Callback exception:', {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        });
        setErrorMessage('OAuth failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'success') return;
    const timeoutId = window.setTimeout(() => {
      router.push('/');
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [status, router]);

  const getText = () => {
    if (locale === 'ru') {
      return {
        loading: 'Подтверждаем email...',
        success: 'Вы вошли через Google!',
        successEmail: 'Ваша почта подтверждена',
        error: 'Ошибка подтверждения',
        errorMessage: 'Попробуйте войти вручную',
        button: 'НАЧАТЬ',
        backToLogin: 'Вернуться к входу',
      };
    } else if (locale === 'he') {
      return {
        loading: 'מאשרים אימייל...',
        success: 'התחברת עם Google!',
        successEmail: 'האימייל שלך אושר בהצלחה',
        error: 'כשל באישור',
        errorMessage: 'נסה להתחבר ידנית',
        button: 'להתחיל לרוץ',
        backToLogin: 'חזרה להתחברות',
      };
    } else {
      return {
        loading: 'Confirming email...',
        success: 'Logged in with Google!',
        successEmail: 'Your email was successfully confirmed',
        error: 'Confirmation failed',
        errorMessage: 'Try logging in manually',
        button: 'START RUNNING',
        backToLogin: 'Back to Login',
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
            <div className="mx-auto w-24 h-24 rounded-full bg-[#22c55e] flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Success text */}
            <h1 className="text-3xl font-bold text-gray-900">
              {isGoogleAuth ? text.success : text.successEmail}
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
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {errorMessage || text.error}
              </h1>
              <p className="text-lg text-gray-600">
                {text.errorMessage}
              </p>
            </div>

            {/* Login link */}
            <div className="space-y-4">
              <Link
                href={`/${locale}/auth/login`}
                className="block w-full max-w-xs mx-auto px-8 py-4 bg-[#ffa500] text-white text-lg font-bold rounded-full hover:bg-[#ff8c00] transition-all text-center"
              >
                {text.backToLogin}
              </Link>
              <p className="text-sm text-gray-500">
                {locale === 'ru' 
                  ? 'Ваш аккаунт может быть уже создан. Попробуйте войти с вашим email и паролем.'
                  : locale === 'he'
                  ? 'החשבון שלך אולי כבר נוצר. נסה להתחבר עם האימייל והסיסמה שלך.'
                  : 'Your account may already be created. Try logging in with your email and password.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

