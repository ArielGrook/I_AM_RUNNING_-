'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';

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
  const { signUp, error, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

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

          {error && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="text-sm text-destructive">{error}</div>
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

