/**
 * Supabase Component Catalog
 * 
 * Loads components from Supabase database instead of static catalog.
 * 
 * Stage 2 Module 5: Component System from Supabase
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { getRedisClient } from '@/lib/redis/client';
import { Component, Category } from '@/lib/types/project';
import { ComponentStyle } from '@/lib/constants/styles';
import { ComponentTag } from '@/lib/constants/tags';
import { componentCatalog } from './catalog'; // Fallback to static catalog

export interface SupabaseComponent {
  id: string;
  name: string;
  category: Category;
  style?: ComponentStyle; // Updated to use ComponentStyle
  type?: string;
  html: string;
  css?: string;
  js?: string;
  description?: string;
  thumbnail?: string;
  tags?: ComponentTag[]; // Updated to use ComponentTag array
  user_id?: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const CACHE_KEY = 'component_catalog';
const CACHE_TTL = 3600; // 1 hour

/**
 * Get component catalog from Supabase with Redis caching
 * 
 * @param includePrivate - Include user's private components (requires auth)
 * @returns Array of components
 */
export async function getComponentCatalog(includePrivate: boolean = false): Promise<SupabaseComponent[]> {
  try {
    const supabase = getSupabaseClient();
    
    // Try Redis cache first (only on server-side)
    if (typeof window === 'undefined') {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(CACHE_KEY);
        
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch {
            // Invalid cache, continue to DB
          }
        }
      } catch {
        // Redis not available, continue to DB
      }
    }
    
    // Query Supabase
    let query = supabase
      .from('components')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });
    
    // Add user's private components if authenticated and requested
    if (includePrivate) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        query = supabase
          .from('components')
          .select('*')
          .or(`is_public.eq.true,user_id.eq.${user.id}`)
          .order('usage_count', { ascending: false });
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to load components from Supabase:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If table doesn't exist (code 42P01), log helpful message
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('❌ Components table does not exist in Supabase!');
        console.error('Please run the schema SQL to create the table: lib/supabase/schema.sql');
      }
      
      // Fallback to static catalog
      return convertStaticCatalogToSupabase();
    }
    
    if (!data || data.length === 0) {
      // No components in DB, return empty array (don't use static catalog)
      return [];
    }
    
    // Filter out poor quality components
    // Remove components with names like "SEO Dream" or other low-quality indicators
    const filteredData = data.filter((component: SupabaseComponent) => {
      const name = component.name?.toLowerCase() || '';
      // Filter out components with these indicators of poor quality
      const poorQualityIndicators = [
        'seo dream',
        'dream header',
        'test component',
        'placeholder',
        'example',
        'demo',
      ];
      
      // Skip if name contains any poor quality indicators
      if (poorQualityIndicators.some(indicator => name.includes(indicator))) {
        return false;
      }
      
      // Only include components with valid structure
      if (!component.html || component.html.trim().length === 0) {
        return false;
      }
      
      // Only include components with valid style (from our predefined list)
      const validStyles = ['modern_dark', 'modern_light', 'modern_gradient', 'classic_white', 'classic_elegant', 'minimal_dark', 'minimal_light', 'corporate_blue', 'corporate_gray', 'creative_colorful', 'creative_artistic', 'vintage_retro', 'tech_neon', 'medical_clean', 'restaurant_warm', 'fashion_elegant', 'ecommerce_modern', 'blog_readable', 'portfolio_showcase', 'custom_authored'];
      if (component.style && !validStyles.includes(component.style)) {
        return false;
      }
      
      return true;
    }) as SupabaseComponent[];
    
    // Cache in Redis (only on server-side)
    if (typeof window === 'undefined') {
      try {
        const redis = getRedisClient();
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(filteredData));
      } catch (cacheError) {
        console.warn('Failed to cache components in Redis:', cacheError);
        // Continue without cache
      }
    }
    
    return filteredData;
    
  } catch (error) {
    console.error('Error loading component catalog:', error);
    // Fallback to static catalog
    return convertStaticCatalogToSupabase();
  }
}

/**
 * Convert static catalog to Supabase format (fallback)
 */
function convertStaticCatalogToSupabase(): SupabaseComponent[] {
  return componentCatalog.flatMap(template => 
    Object.entries(template.variants).map(([style, html]) => ({
      id: `${template.id}-${style}`,
      name: `${template.name} (${style})`,
      category: template.category,
      style: style as StyleVariant,
      html: html.trim(),
      description: template.description,
      thumbnail: template.thumbnail,
      tags: [template.category, style],
      is_public: true,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  );
}

/**
 * Save component to Supabase
 * 
 * @param component - Component data to save
 * @returns Saved component with ID
 */
export async function saveComponent(component: {
  name: string;
  category: Category;
  style: ComponentStyle; // Now required
  type?: string;
  html: string;
  css?: string;
  js?: string;
  description?: string;
  tags?: ComponentTag[]; // Array of ComponentTag
  thumbnail?: string;
  is_public?: boolean;
}): Promise<SupabaseComponent> {
  try {
    const supabase = getSupabaseClient();
    
    // Try to get current user (optional - allow anonymous saves)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Validate style and tags
    if (!component.style) {
      throw new Error('Style is required');
    }
    
    // CRITICAL FIX: Ensure CSS is never null (use empty string if undefined)
    const cssContent = component.css || '';
    
    // Log for debugging
    console.log('[saveComponent] Saving to database:', {
      name: component.name,
      htmlLength: component.html?.length || 0,
      cssLength: cssContent.length,
      cssPreview: cssContent.substring(0, 100),
      hasCss: cssContent.length > 0,
    });

    // Insert component (allow anonymous saves for demo mode)
    const { data, error } = await supabase
      .from('components')
      .insert({
        name: component.name,
        category: component.category,
        style: component.style,
        type: component.type,
        html: component.html,
        css: cssContent, // Always save CSS (empty string if none, never null)
        js: component.js || '',
        description: component.description,
        tags: component.tags || [],
        preview_img: component.thumbnail,
        is_public: component.is_public ?? true, // Default to public for anonymous saves
        user_id: user?.id || null, // Allow null for anonymous saves
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to save component to Supabase:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If table doesn't exist, provide helpful error message
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Components table does not exist in Supabase. Please run the schema SQL to create it.');
      }
      
      throw new Error(`Failed to save component: ${error.message}`);
    }
    
    // Invalidate cache (only on server-side)
    if (typeof window === 'undefined') {
      try {
        const redis = getRedisClient();
        await redis.del(CACHE_KEY);
      } catch {
        // Cache invalidation failed, not critical
      }
    }
    
    return data as SupabaseComponent;
    
  } catch (error) {
    console.error('Error saving component:', error);
    throw error;
  }
}

/**
 * Update component in Supabase
 */
export async function updateComponent(
  id: string,
  updates: Partial<Omit<SupabaseComponent, 'id' | 'user_id' | 'created_at' | 'usage_count'>>
): Promise<SupabaseComponent> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    const { data, error } = await supabase
      .from('components')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the component
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update component: ${error.message}`);
    }
    
    // Invalidate cache (only on server-side)
    if (typeof window === 'undefined') {
      try {
        const redis = getRedisClient();
        await redis.del(CACHE_KEY);
      } catch {
        // Not critical
      }
    }
    
    return data as SupabaseComponent;
    
  } catch (error) {
    console.error('Error updating component:', error);
    throw error;
  }
}

/**
 * Delete component from Supabase
 */
export async function deleteComponent(id: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    const { error } = await supabase
      .from('components')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the component
    
    if (error) {
      throw new Error(`Failed to delete component: ${error.message}`);
    }
    
    // Invalidate cache (only on server-side)
    if (typeof window === 'undefined') {
      try {
        const redis = getRedisClient();
        await redis.del(CACHE_KEY);
      } catch {
        // Not critical
      }
    }
    
  } catch (error) {
    console.error('Error deleting component:', error);
    throw error;
  }
}

/**
 * Increment usage count for a component (track popularity)
 */
export async function incrementComponentUsage(id: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.rpc('increment_component_usage', { component_id: id });
  } catch (error) {
    // Non-critical, just log
    console.warn('Failed to increment component usage:', error);
  }
}








