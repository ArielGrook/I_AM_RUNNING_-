import { createClient } from '@supabase/supabase-js';

/**
 * Updates user role in both profiles table (source of truth) and user_metadata (cache)
 * Call this when user purchases subscription or admin changes role
 * 
 * IMPORTANT: This function uses service role key - only call from server-side code!
 */
export async function updateUserRole(userId: string, newRole: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Get Supabase service role client (has admin permissions)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only!
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    console.log('🔄 Updating user role:', { userId, newRole });
    
    // 1. Update profiles table (source of truth)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (profileError) {
      console.error('❌ Failed to update profile:', profileError);
      return { success: false, error: profileError.message };
    }
    
    console.log('✅ Profile updated in database');
    
    // 2. Update user_metadata (cache for fast access)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole }
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
