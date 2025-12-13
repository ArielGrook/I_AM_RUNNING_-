/**
 * User Package Utilities
 * 
 * Check user package status and feature access.
 * 
 * Stage 4 Module 11: Monetization
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/supabase/auth';
import { PackageType } from '@/lib/types/payment';

export interface UserPackage {
  id: string;
  user_id: string;
  package_type: PackageType;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  activated_at: string | null;
  expires_at: string | null;
}

/**
 * Get user's active package
 */
export async function getUserPackage(): Promise<UserPackage | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('user_packages')
        .update({ status: 'expired' })
        .eq('id', data.id);
      
      return null;
    }

    return data as UserPackage;
  } catch (error) {
    console.error('Failed to get user package:', error);
    return null;
  }
}

/**
 * Check if user has access to feature
 */
export async function hasFeatureAccess(feature: 'save' | 'export' | 'chat' | 'import' | 'multipage' | 'ecommerce'): Promise<boolean> {
  const pkg = await getUserPackage();
  
  if (!pkg) {
    // Demo mode - limited access
    return feature !== 'multipage' && feature !== 'ecommerce';
  }

  // Check package type
  switch (pkg.package_type) {
    case 'landing':
      return feature !== 'multipage' && feature !== 'ecommerce';
    case 'multipage':
      return feature !== 'ecommerce';
    case 'ecommerce':
      return true; // All features
    default:
      return false;
  }
}

/**
 * Check if user can create multiple pages
 */
export async function canCreateMultiplePages(): Promise<boolean> {
  return hasFeatureAccess('multipage');
}








