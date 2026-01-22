'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/useAuth';
import { createLucideIcon, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { signInWithGoogle } from '@/lib/supabase/auth';

const GoogleIcon = createLucideIcon('Google', [
  ['circle', { cx: '12', cy: '12', r: '9', key: 'circle' }],
  ['path', { d: 'M16 12h-4v4', key: 'g1' }],
  ['path', { d: 'M12 8a4 4 0 1 0 0 8', key: 'g2' }],
]);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const { signIn, loading, error, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations('Auth');

  // Redirect when authenticated - check role first
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 User authenticated, redirecting to home');
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      console.log('🔐 Attempting email/password login...');
      await signIn(email, password);
      // Redirect will happen via useEffect when isAuthenticated becomes true
    } catch (error) {
      console.error('❌ Login failed:', error);
      // Error is handled by the useAuth hook
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleError('');
      setIsGoogleLoading(true);
      console.log('🔐 Attempting Google auth...');
      await signInWithGoogle(`${window.location.origin}/auth/callback`);
      // OAuth redirect will happen automatically
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      const rawMessage = error instanceof Error ? error.message : 'OAuth failed';
      const message = rawMessage.toLowerCase().includes('account exists with different credential')
        ? t('linkGoogleInSettings')
        : rawMessage;
      setGoogleError(message);
      // Error is handled by the useAuth hook
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:text-primary/80"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 ${emailError ? 'border-destructive focus:border-destructive' : ''}`}
                placeholder="Enter your email"
              />
              {emailError && (
                <p className="mt-1 text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 ${passwordError ? 'border-destructive focus:border-destructive' : ''}`}
                placeholder="Enter your password"
              />
              {passwordError && (
                <p className="mt-1 text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>

          {(error || googleError) && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="text-sm text-destructive">{googleError || error}</div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading || isGoogleLoading}
              variant="outline"
              className="w-full bg-white text-gray-900 border-gray-300 hover:bg-gray-50 dark:bg-white dark:text-gray-900 dark:border-gray-300"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('signingInWithGoogle')}
                </>
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  {t('continueWithGoogle')}
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

