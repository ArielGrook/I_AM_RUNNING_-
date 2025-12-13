/**
 * Supabase Project Sync
 * 
 * Sync project data to Supabase projects table.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { Project } from '@/lib/types/project';

/**
 * Save project to Supabase
 */
export async function saveProjectToSupabase(project: Project): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Not authenticated, skip Supabase save
      return;
    }

    const supabase = createSupabaseClient();
    
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        user_id: user.id,
        name: project.name,
        description: project.description,
        data: project,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Failed to save project to Supabase:', error);
      // Don't throw - allow local save to continue
    }
  } catch (error) {
    console.error('Supabase sync error:', error);
    // Don't throw - allow local save to continue
  }
}

/**
 * Load project from Supabase
 */
export async function loadProjectFromSupabase(projectId: string): Promise<Project | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    // Return project data
    return data.data as Project;
  } catch (error) {
    console.error('Failed to load project from Supabase:', error);
    return null;
  }
}

/**
 * List user's projects from Supabase
 */
export async function listProjectsFromSupabase(): Promise<Project[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(row => row.data as Project);
  } catch (error) {
    console.error('Failed to list projects from Supabase:', error);
    return [];
  }
}








