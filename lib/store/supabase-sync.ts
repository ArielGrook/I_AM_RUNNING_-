/**
 * Supabase Project Sync
 *
 * Sync project data to Supabase projects table.
 * Supports both `contract` (Living Project JSON v2) and legacy `data` columns.
 *
 * Stage 3 Module 8: Shadow Mode
 * Roadmap v4.0: contract + data mirror
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { Project } from '@/lib/types/project';

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  data?: Project | null;
  contract?: Project | null;
  preview_token?: string | null;
  source?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

/** Prefer contract, fallback to data (backward compat) */
function getProjectData(row: ProjectRow): Project | null {
  const contract = row.contract;
  const data = row.data;
  const hasContract =
    contract &&
    typeof contract === 'object' &&
    Object.keys(contract).length > 0;
  const projectData = hasContract ? contract : data;
  if (!projectData || typeof projectData !== 'object') {
    return null;
  }
  const base = projectData as Project;
  return {
    ...base,
    ...(row.preview_token && {
      preview_token: row.preview_token,
    } as Partial<Project & { preview_token?: string }>),
  };
}

/**
 * Save project to Supabase
 * Writes to BOTH contract (primary) and data (legacy mirror).
 */
export async function saveProjectToSupabase(project: Project): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return;
    }

    const supabase = createSupabaseClient();
    const projectWithMeta = project as Project & {
      preview_token?: string;
      source?: string;
      status?: string;
    };

    const { error } = await supabase
      .from('projects')
      .upsert(
        {
          id: project.id,
          user_id: user.id,
          name: project.name,
          description: project.description,
          contract: project,
          data: project,
          source: projectWithMeta.source ?? 'editor',
          status: projectWithMeta.status ?? 'draft',
          preview_token:
            projectWithMeta.preview_token ?? crypto.randomUUID(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Failed to save project to Supabase:', error);
    }
  } catch (error) {
    console.error('Supabase sync error:', error);
  }
}

/**
 * Load project from Supabase
 * Prefers contract, fallback to data (backward compat).
 */
export async function loadProjectFromSupabase(
  projectId: string
): Promise<Project | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    return getProjectData(data as ProjectRow);
  } catch (error) {
    console.error('Failed to load project from Supabase:', error);
    return null;
  }
}

/**
 * List user's projects from Supabase
 * Prefers contract, fallback to data (backward compat).
 */
export async function listProjectsFromSupabase(): Promise<Project[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];

    return data
      .map((row) => getProjectData(row as ProjectRow))
      .filter((p): p is Project => p != null);
  } catch (error) {
    console.error('Failed to list projects from Supabase:', error);
    return [];
  }
}








