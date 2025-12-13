/**
 * PayPal Webhook Handler
 * 
 * Handles PayPal webhook events for payment confirmations.
 * 
 * Stage 4 Module 11: Monetization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * Verify PayPal webhook signature
 */
async function verifyWebhookSignature(
  headers: Headers,
  body: string
): Promise<boolean> {
  // In production, verify webhook signature from PayPal
  // For now, basic validation
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return false;
  }

  // TODO: Implement proper signature verification
  // See: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = request.headers;

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(headers, body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    
    // Handle different event types
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
      const amount = event.resource?.amount?.value;
      
      if (orderId && amount) {
        // Update user package status
        const supabase = createSupabaseClient();
        
        // Find user by order_id
        const { data: packageData } = await supabase
          .from('user_packages')
          .select('user_id, package_type')
          .eq('order_id', orderId)
          .single();

        if (packageData) {
          // Update package status
          await supabase
            .from('user_packages')
            .update({
              status: 'active',
              activated_at: new Date().toISOString(),
            })
            .eq('order_id', orderId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}








