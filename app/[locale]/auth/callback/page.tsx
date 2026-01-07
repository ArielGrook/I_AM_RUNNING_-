'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');

        // The auth state change listener in useAuth will handle the session
        // We just need to wait for authentication to complete
        const timeout = setTimeout(() => {
          if (!isAuthenticated && !loading) {
            console.log('⏰ OAuth callback timeout');
            setError('Authentication timed out. Please try again.');
          }
        }, 10000); // 10 second timeout

        return () => clearTimeout(timeout);
      } catch (err) {
        console.error('❌ OAuth callback error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('✅ OAuth authentication successful, redirecting...');
      router.push('/editor');
    }
  }, [isAuthenticated, loading, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="rounded-md bg-destructive/10 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Authentication Error
            </h2>
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="text-primary hover:text-primary/80 underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Signing you in...
          </h2>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
