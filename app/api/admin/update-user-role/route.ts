import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function mapToLegacyRole(
  accountType: string,
  tier: string | null
): number {
  if (accountType === 'regular') return 1;
  if (tier === 'frontend') return 2;
  if (tier === 'full_stack' || tier === 'professional') return 3;
  return 1;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, accountType, freelancerTier } = await request.json();

    if (!userId || !accountType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatePayload = {
      account_type: accountType,
      freelancer_tier: freelancerTier,
      freelancer_status: accountType === 'freelancer' ? 'active' : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', userId);

    if (error) {
      if (error.code === '42P01') {
        const role = mapToLegacyRole(accountType, freelancerTier);
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (profileError) {
          return NextResponse.json({ error: profileError.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
