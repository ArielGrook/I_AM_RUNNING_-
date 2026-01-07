'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Our commitment to protecting your privacy...
          </p>
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-sm text-gray-500">Privacy policy content coming soon</p>
        </div>
      </div>
    </div>
  );
}
