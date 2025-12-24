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
      // No components in DB, use static catalog
      return convertStaticCatalogToSupabase();
    }
    
    // Cache in Redis (only on server-side)
    if (typeof window === 'undefined') {
      try {
        const redis = getRedisClient();
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(data));
      } catch (cacheError) {
        console.warn('Failed to cache components in Redis:', cacheError);
        // Continue without cache
      }
    }
    
    return data as SupabaseComponent[];
    
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required to save components');
    }
    
    // Validate style and tags
    if (!component.style) {
      throw new Error('Style is required');
    }
    
    // Insert component
    const { data, error } = await supabase
      .from('components')
      .insert({
        name: component.name,
        category: component.category,
        style: component.style,
        type: component.type,
        html: component.html,
        css: component.css,
        js: component.js,
        description: component.description,
        tags: component.tags || [],
        preview_img: component.thumbnail,
        is_public: component.is_public ?? false,
        user_id: user.id,
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








