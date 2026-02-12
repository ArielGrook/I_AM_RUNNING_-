import { createClient } from '@supabase/supabase-js';

/** Legacy role: 0=anon, 1=basic, 2=freelancer, 3=premium */
type LegacyRole = number;

/** New schema: account_type + freelancer_tier (Roadmap v4.0) */
export type AccountType = 'regular' | 'freelancer';
export type FreelancerTier = 'frontend' | 'full_stack' | 'professional';

/**
 * Maps legacy role (0-3) to users table schema (account_type, freelancer_tier)
 */
function mapRoleToUsersSchema(role: LegacyRole): {
  account_type: AccountType;
  freelancer_tier: FreelancerTier | null;
} {
  if (role <= 1) {
    return { account_type: 'regular', freelancer_tier: null };
  }
  if (role === 2) {
    return { account_type: 'freelancer', freelancer_tier: 'frontend' };
  }
  return { account_type: 'freelancer', freelancer_tier: 'full_stack' };
}

/**
 * Updates user role in users table (source of truth) and user_metadata (cache).
 * Call when user purchases subscription or admin changes role.
 *
 * Backward compatible: accepts legacy role 0-3, maps to account_type + freelancer_tier.
 *
 * IMPORTANT: Uses service role key - only call from server-side code!
 */
export async function updateUserRole(
  userId: string,
  newRole: LegacyRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { account_type, freelancer_tier } = mapRoleToUsersSchema(newRole);
    console.log('🔄 Updating user role:', { userId, newRole, account_type, freelancer_tier });

    // 1. Update users table (source of truth)
    const usersUpdate: Record<string, unknown> = {
      account_type,
      freelancer_tier,
      freelancer_status: freelancer_tier ? 'active' : null,
      updated_at: new Date().toISOString(),
    };
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .update(usersUpdate)
      .eq('id', userId);

    if (usersError) {
      console.error('❌ Failed to update users:', usersError);
      return { success: false, error: usersError.message };
    }

    console.log('✅ Users table updated');

    // 2. Update user_metadata (cache for fast access, backward compat with role)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: newRole,
        account_type,
        freelancer_tier,
      },
    });

    if (authError) {
      console.error('❌ Failed to update user_metadata:', authError);
      return { success: false, error: authError.message };
    }

    console.log('✅ User metadata updated');
    return { success: true };
  } catch (err) {
    console.error('❌ Exception updating user role:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Updates user account directly with new schema (account_type, freelancer_tier).
 * Use for new code that no longer relies on legacy role numbers.
 */
export async function updateUserAccount(
  userId: string,
  updates: {
    account_type?: AccountType;
    freelancer_tier?: FreelancerTier | null;
    freelancer_status?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabaseAdmin
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('❌ Failed to update users:', error);
      return { success: false, error: error.message };
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updates,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
