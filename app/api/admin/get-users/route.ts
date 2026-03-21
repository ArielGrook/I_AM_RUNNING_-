import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';

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

function mapRoleToAccountType(role: number | null): {
  account_type: 'regular' | 'freelancer';
  freelancer_tier: 'frontend' | 'full_stack' | 'professional' | null;
} {
  if (role == null || role <= 1) {
    return { account_type: 'regular', freelancer_tier: null };
  }
  if (role === 2) {
    return { account_type: 'freelancer', freelancer_tier: 'frontend' };
  }
  return { account_type: 'freelancer', freelancer_tier: 'full_stack' };
}

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { data: usersData, error } = await supabaseAdmin
      .from('users')
      .select('id, user_number, email, full_name, account_type, freelancer_tier, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        const { data: profilesData, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, role, created_at')
          .order('created_at', { ascending: false });

        if (profilesError) {
          return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        const users = (profilesData || []).map((p: { id: string; email: string; full_name: string | null; role: number; created_at: string }) => {
          const { account_type, freelancer_tier } = mapRoleToAccountType(p.role);
          return {
            id: p.id,
            user_number: null,
            email: p.email,
            full_name: p.full_name,
            account_type,
            freelancer_tier,
            created_at: p.created_at,
          };
        });
        return NextResponse.json({ users });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: usersData || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
