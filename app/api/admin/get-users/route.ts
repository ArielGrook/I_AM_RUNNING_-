import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Source of truth for roles: auth.users.user_metadata.role
    // This is what update-user-role writes to via Admin API
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError2) {
      return NextResponse.json({ error: authError2.message }, { status: 500 });
    }

    // Also fetch profiles for user_number and extra fields
    const { data: profilesData } = await supabaseAdmin
      .from('profiles')
      .select('id, user_number, agency_id, trial_expires_at');

    const profileMap = new Map(
      (profilesData || []).map((p: { id: string; user_number?: number; agency_id?: string | null; trial_expires_at?: string | null }) => [p.id, p])
    );

    const users = (authData?.users || []).map((u) => {
      const meta = u.user_metadata || {};
      const profile = profileMap.get(u.id);
      const role = typeof meta.role === 'number' ? meta.role : 1;

      return {
        id: u.id,
        email: u.email ?? '',
        full_name: meta.full_name || meta.name || null,
        role,                                    // ← numeric role, always fresh
        agency_id: profile?.agency_id ?? null,
        trial_expires_at: profile?.trial_expires_at ?? null,
        user_number: profile?.user_number ?? null,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at ?? null,
      };
    });

    // Sort by created_at desc
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
