/**
 * Supabase Project Sync
 *
 * One-Way Ejection Architecture:
 * - Wizard writes ONLY to contract; data stays NULL
 * - Editor first load: generates from contract if data is NULL
 * - Editor save: writes ONLY to data (GrapesJS native format)
 * - contract becomes read-only after first editor save
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { Project } from '@/lib/types/project';

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  data?: Record<string, unknown> | null;
  contract?: Project | Record<string, unknown> | null;
  preview_token?: string | null;
  source?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

/** GrapesJS editor instance with getProjectData */
export type GrapesJSEditorLike = { getProjectData: () => Record<string, unknown> };

/** Prefer data (editor state) over contract (wizard state) - One-Way Ejection */
function getProjectDataFromRow(row: ProjectRow): { projectData: Project | Record<string, unknown> | null; loadedFrom: 'data' | 'contract' } {
  const hasData = row.data && typeof row.data === 'object' && Object.keys(row.data).length > 0;
  const hasContract = row.contract && typeof row.contract === 'object' && Object.keys(row.contract).length > 0;
  if (hasData) {
    return { projectData: row.data as Record<string, unknown>, loadedFrom: 'data' };
  }
  if (hasContract) {
    const c = row.contract as Project;
    return {
      projectData: {
        ...c,
        ...(row.preview_token && { preview_token: row.preview_token }),
      },
      loadedFrom: 'contract',
    };
  }
  return { projectData: null, loadedFrom: 'contract' };
}

/** Legacy: for listProjects - prefer data, fallback contract */
function getProjectData(row: ProjectRow): Project | null {
  const { projectData } = getProjectDataFromRow(row);
  if (!projectData || typeof projectData !== 'object') return null;
  return projectData as Project;
}

/**
 * Save project to Supabase - One-Way Ejection
 * Writes ONLY to data field (GrapesJS native format). Does NOT touch contract.
 */
export async function saveProjectToSupabase(
  project: Project,
  editorInstance?: GrapesJSEditorLike | null
): Promise<{ data?: { id: string }; error?: unknown }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    let dataToSave: Record<string, unknown> | null = null;

    if (editorInstance?.getProjectData) {
      dataToSave = editorInstance.getProjectData();
      console.log('💾 Saving GrapesJS native format to data field');
    } else if ((project as Project & { data?: unknown }).data && typeof (project as Project & { data?: unknown }).data === 'object') {
      dataToSave = (project as Project & { data: Record<string, unknown> }).data;
    }

    const supabase = createSupabaseClient();
    const projectWithMeta = project as Project & {
      preview_token?: string;
      source?: string;
      status?: string;
    };

    const payload: Record<string, unknown> = {
      id: project.id,
      user_id: user.id,
      name: project.name || 'Untitled Project',
      description: project.description ?? '',
      data: dataToSave ?? { pages: [{ component: '', styles: [] }] },
      source: 'editor',
      status: projectWithMeta.status ?? 'draft',
      preview_token: projectWithMeta.preview_token ?? crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    };
    // CRITICAL: Do NOT include contract - it stays as-is from wizard

    const { data, error } = await supabase
      .from('projects')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save project to Supabase:', error);
      return { error };
    }

    return { data: data ? { id: project.id } : undefined };
  } catch (error) {
    console.error('Supabase sync error:', error);
    return { error };
  }
}

/** Loaded project with projectData for editor (data or contract) */
export type LoadedProject = {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  projectData: Project | Record<string, unknown>;
  loadedFrom: 'data' | 'contract';
  [key: string]: unknown;
};

/**
 * Load project from Supabase - One-Way Ejection
 * Prefers data (editor state) over contract (wizard state).
 */
export async function loadProjectFromSupabase(
  projectId: string
): Promise<LoadedProject | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = createSupabaseClient();
    const { data: row, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !row) return null;

    const { projectData, loadedFrom } = getProjectDataFromRow(row as ProjectRow);
    if (!projectData) return null;

    console.log(
      loadedFrom === 'data'
        ? '✅ Loading from data (editor state)'
        : '⚠️ Loading from contract (wizard state)'
    );

    return {
      ...row,
      projectData,
      loadedFrom,
    } as LoadedProject;
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








