/**
 * PayPal Capture Order API
 * 
 * Captures payment and activates package.
 * 
 * Stage 4 Module 11: Monetization
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PackageTypeSchema } from '@/lib/types/payment';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/supabase/auth';

const CaptureOrderSchema = z.object({
  orderId: z.string(),
  packageType: PackageTypeSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CaptureOrderSchema.parse(body);

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Capture PayPal order
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET;
    const paypalBaseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    if (!paypalClientId || !paypalSecret) {
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 500 }
      );
    }

    // Get access token
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const { access_token } = await tokenResponse.json();

    // Capture order
    const captureResponse = await fetch(
      `${paypalBaseUrl}/v2/checkout/orders/${validated.orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const error = await captureResponse.json();
      throw new Error(error.message || 'Failed to capture order');
    }

    const capture = await captureResponse.json();

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Update user package in Supabase
    const supabase = createSupabaseClient();
    const { error: updateError } = await supabase
      .from('user_packages')
      .upsert({
        user_id: user.id,
        package_type: validated.packageType,
        order_id: validated.orderId,
        status: 'active',
        activated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (updateError) {
      console.error('Failed to update user package:', updateError);
      // Don't fail - payment is captured
    }

    return NextResponse.json({
      success: true,
      orderId: validated.orderId,
      packageType: validated.packageType,
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture payment' },
      { status: 500 }
    );
  }
}








