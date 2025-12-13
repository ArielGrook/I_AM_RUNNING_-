/**
 * PayPal Create Order API
 * 
 * Creates a PayPal order for package purchase.
 * 
 * Stage 4 Module 11: Monetization
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PackageTypeSchema, PAYMENT_PACKAGES } from '@/lib/types/payment';

const CreateOrderSchema = z.object({
  packageType: PackageTypeSchema,
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateOrderSchema.parse(body);

    const pkg = PAYMENT_PACKAGES[validated.packageType];
    
    // Verify amount matches package price
    if (validated.amount !== pkg.price) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Create PayPal order via PayPal API
    // In production, use PayPal SDK server-side
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

    // Create order
    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: validated.amount.toString(),
            },
            description: `${pkg.name} Package`,
          },
        ],
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      throw new Error(error.message || 'Failed to create order');
    }

    const order = await orderResponse.json();

    return NextResponse.json({
      orderId: order.id,
      packageType: validated.packageType,
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}








