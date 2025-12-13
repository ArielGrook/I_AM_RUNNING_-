/**
 * Package Selector Component
 * 
 * Display payment packages and allow selection.
 * 
 * Stage 4 Module 11: Monetization
 */

'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentButton } from './PaymentButton';
import { PackageType, PAYMENT_PACKAGES } from '@/lib/types/payment';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (packageType: PackageType) => void;
}

export function PackageSelector({ open, onOpenChange, onSuccess }: PackageSelectorProps) {
  const t = useTranslations('Payment');
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);

  const handlePaymentSuccess = (orderId: string) => {
    if (selectedPackage) {
      onSuccess?.(selectedPackage);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('selectPackage')}</DialogTitle>
          <DialogDescription>
            {t('selectPackageDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {Object.values(PAYMENT_PACKAGES).map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                'border rounded-lg p-6 cursor-pointer transition',
                selectedPackage === pkg.type
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-gray-300'
              )}
              onClick={() => setSelectedPackage(pkg.type)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{pkg.name}</h3>
                <div className="text-2xl font-bold">${pkg.price}</div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
              <ul className="space-y-2 mb-4">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {selectedPackage === pkg.type && (
                <div className="mt-4">
                  <PaymentButton
                    packageType={pkg.type}
                    onSuccess={handlePaymentSuccess}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}








