'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Building, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  // No sidebar found in profile.
  const { user, profile, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const getRoleName = (role: number) => {
    switch (role) {
      case 0: return 'Anonymous';
      case 1: return 'Basic User';
      case 2: return 'Freelancer';
      case 3: return 'Premium';
      default: return 'Unknown';
    }
  };

  const getRoleColor = (role: number) => {
    switch (role) {
      case 0: return 'text-gray-500';
      case 1: return 'text-blue-500';
      case 2: return 'text-green-500';
      case 3: return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#262626] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user?.email}
                  </p>
                </div>
              </div>

              {profile?.company && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building className="h-4 w-4" />
                  <span>{profile.company}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className={`text-sm font-medium ${getRoleColor(profile?.role || 0)}`}>
                  {getRoleName(profile?.role || 0)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4" />
                <span>AI Requests: {profile?.ai_requests_today || 0} / {profile?.ai_requests_limit || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/settings')}
              >
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/subscription')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Subscription & Billing
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/privacy')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/terms')}
              >
                <User className="mr-2 h-4 w-4" />
                Terms of Service
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                🚧 Profile Features Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We're working on advanced profile management features. For now, you can manage your account through the settings above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
