/**
 * PayPal Payment Button Component
 * 
 * PayPal checkout button for package purchases.
 * 
 * Stage 4 Module 11: Monetization
 */

'use client';

import { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Button } from '@/components/ui/button';
import { PackageType, PAYMENT_PACKAGES } from '@/lib/types/payment';
import { useTranslations } from 'next-intl';

interface PaymentButtonProps {
  packageType: PackageType;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export function PaymentButton({ packageType, onSuccess, onError }: PaymentButtonProps) {
  const t = useTranslations('Payment');
  const [isProcessing, setIsProcessing] = useState(false);
  const pkg = PAYMENT_PACKAGES[packageType];

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  if (!paypalClientId) {
    return (
      <div className="text-sm text-gray-500">
        {t('notConfigured')}
      </div>
    );
  }

  const createOrder = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType,
          amount: pkg.price,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.orderId;
    } catch (error) {
      console.error('Order creation failed:', error);
      onError?.(error instanceof Error ? error.message : 'Order creation failed');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderID,
          packageType,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Payment capture failed');
      }

      onSuccess?.(data.orderID);
    } catch (error) {
      console.error('Payment capture failed:', error);
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(error) => {
          console.error('PayPal error:', error);
          onError?.(error.message || 'Payment error');
        }}
        disabled={isProcessing}
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
        }}
      />
    </PayPalScriptProvider>
  );
}








