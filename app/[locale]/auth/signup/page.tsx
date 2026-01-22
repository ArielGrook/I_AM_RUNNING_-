'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/useAuth';
import { createLucideIcon, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '@/lib/supabase/auth';

const GoogleIcon = createLucideIcon('Google', [
  ['circle', { cx: '12', cy: '12', r: '9', key: 'circle' }],
  ['path', { d: 'M16 12h-4v4', key: 'g1' }],
  ['path', { d: 'M12 8a4 4 0 1 0 0 8', key: 'g2' }],
]);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const { signUp, error, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth');

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

    // Confirm password validation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signUp(
        email,
        password,
        {
          full_name: fullName.trim() || undefined,
        },
        locale
      );

      setSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      // Error is handled by the useAuth hook
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleError('');
      setIsGoogleLoading(true);
      await signInWithGoogle(`${window.location.origin}/auth/callback`);
    } catch (err) {
      console.error('❌ Google sign up failed:', err);
      const rawMessage = err instanceof Error ? err.message : 'OAuth failed';
      const message = rawMessage.toLowerCase().includes('account exists with different credential')
        ? t('linkGoogleInSettings')
        : rawMessage;
      setGoogleError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Show full-screen success message
  // ALWAYS render success screen first if success=true
  // This prevents any layout/loading screen interference
  if (success) {
    return (
      <div 
        className="flex flex-col items-center justify-center"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          minHeight: '100vh',
          backgroundColor: 'white'
        }}
      >
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="text-4xl font-bold text-[#ffa500]">I AM RUNNING</div>
          </div>
          
          {/* Message */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {locale === 'ru' 
                ? 'СПАСИБО ЧТО ЗАРЕГИСТРИРОВАЛИСЬ НА I AM RUNNING' 
                : locale === 'he'
                ? 'תודה שנרשמתם ל I AM RUNNING'
                : 'THANK YOU FOR REGISTERING FOR I AM RUNNING'}
            </h2>
            <p className="text-gray-600">
              {locale === 'ru'
                ? 'Проверьте свою электронную почту для завершения регистрации. Вы можете закрыть это окно'
                : locale === 'he'
                ? 'בדקו את האימייל שלכם כדי להשלים את ההרשמה. ניתן לסגור חלון זה'
                : 'Check your email to complete your registration. You can close this window.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                Full Name (Optional)
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
                placeholder="Enter your full name"
              />
            </div>

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 ${passwordError ? 'border-destructive focus:border-destructive' : ''}`}
                placeholder="Create a password (min 6 characters)"
              />
              {passwordError && (
                <p className="mt-1 text-sm text-destructive">{passwordError}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1 ${confirmPasswordError ? 'border-destructive focus:border-destructive' : ''}`}
                placeholder="Confirm your password"
              />
              {confirmPasswordError && (
                <p className="mt-1 text-sm text-destructive">{confirmPasswordError}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading || isGoogleLoading}
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

          {(error || googleError) && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="text-sm text-destructive">{googleError || error}</div>
            </div>
          )}

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
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

