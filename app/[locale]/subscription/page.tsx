'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth';

type PlanKey = 'starter' | 'basic' | 'pro';

export default function SubscriptionPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Subscription');
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/${locale}/auth/login`);
    }
  }, [loading, isAuthenticated, locale, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-700">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const plans: { key: PlanKey; highlight?: boolean }[] = [
    { key: 'starter' },
    { key: 'basic', highlight: true },
    { key: 'pro' },
  ];

  const handleChoosePlan = (planKey: PlanKey) => {
    console.log('Selected plan:', planKey);
    alert(t('comingSoon'));
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const features = t.raw(`plans.${plan.key}.features`) as string[];
            return (
              <Card
                key={plan.key}
                className={`border-2 ${plan.highlight ? 'border-orange-500' : 'border-gray-300'} rounded-lg shadow-md bg-white`}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {t(`plans.${plan.key}.name`)}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {t(`plans.${plan.key}.description`)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-orange-500">
                    {t(`plans.${plan.key}.price`)}
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => handleChoosePlan(plan.key)}
                  >
                    {t('choosePlan')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
