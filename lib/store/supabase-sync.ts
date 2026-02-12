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
  tags?: string[];
  category?: string;
  visibility?: 'private' | 'public' | 'unlisted';
  version?: number;
  metadata?: Record<string, unknown>;
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

/** Optional metadata to save alongside the project */
export type ProjectMetadataUpdate = {
  tags?: string[];
  category?: string;
  visibility?: 'private' | 'public' | 'unlisted';
};

/**
 * Save project to Supabase - One-Way Ejection
 * Writes ONLY to data field (GrapesJS native format). Does NOT touch contract.
 * When fullProjectData is provided (e.g. multi-page from editor), uses it to save ALL pages.
 * Supports optional metadata (tags, category, visibility) and auto-increments version.
 */
export async function saveProjectToSupabase(
  project: Project,
  editorInstance?: GrapesJSEditorLike | null,
  fullProjectData?: Record<string, unknown> | null,
  metadataUpdate?: ProjectMetadataUpdate | null,
  currentVersion?: number
): Promise<{ data?: { id: string; version: number }; error?: unknown }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    let dataToSave: Record<string, unknown> | null = null;

    if (fullProjectData && typeof fullProjectData === 'object') {
      dataToSave = fullProjectData;
      const pagesCount = (fullProjectData.pages as unknown[] | undefined)?.length ?? 0;
      console.log('💾 Saving project with pages:', pagesCount);
    } else if (editorInstance?.getProjectData) {
      dataToSave = editorInstance.getProjectData();
      const pagesCount = (dataToSave?.pages as unknown[] | undefined)?.length ?? 0;
      console.log('💾 Saving GrapesJS native format to data field, pages:', pagesCount);
    } else if ((project as Project & { data?: unknown }).data && typeof (project as Project & { data?: unknown }).data === 'object') {
      dataToSave = (project as Project & { data: Record<string, unknown> }).data;
    }

    const supabase = createSupabaseClient();
    const projectWithMeta = project as Project & {
      preview_token?: string;
      source?: string;
      status?: string;
      version?: number;
      tags?: string[];
      category?: string;
      visibility?: string;
      metadata?: Record<string, unknown>;
    };

    // Increment version on every save — use explicit currentVersion param (not project.version which is undefined)
    const newVersion = (currentVersion ?? projectWithMeta.version ?? 0) + 1;
    console.log(`💾 Version: ${currentVersion ?? projectWithMeta.version ?? 0} → ${newVersion}`);

    const payload: Record<string, unknown> = {
      id: project.id,
      user_id: user.id,
      name: project.name || 'Untitled Project',
      description: project.description ?? '',
      data: dataToSave ?? { pages: [{ component: '', styles: [] }] },
      source: 'editor',
      status: projectWithMeta.status ?? 'draft',
      preview_token: projectWithMeta.preview_token ?? crypto.randomUUID(),
      version: newVersion,
      updated_at: new Date().toISOString(),
    };

    // Include metadata fields if provided
    if (metadataUpdate?.tags !== undefined) payload.tags = metadataUpdate.tags;
    if (metadataUpdate?.category !== undefined) payload.category = metadataUpdate.category;
    if (metadataUpdate?.visibility !== undefined) payload.visibility = metadataUpdate.visibility;

    // Merge metadata JSON
    const mergedMetadata = {
      ...(projectWithMeta.metadata || {}),
      lastModified: new Date().toISOString(),
    };
    payload.metadata = mergedMetadata;

    // CRITICAL: Do NOT include contract - it stays as-is from wizard

    const { data, error } = await supabase
      .from('projects')
      .upsert(payload, { onConflict: 'id' })
      .select('id, version')
      .single();

    if (error) {
      console.error('Failed to save project to Supabase:', error);
      return { error };
    }

    const savedVersion = (data as { id: string; version: number } | null)?.version ?? newVersion;
    console.log(`✅ Project saved (version ${savedVersion})`);
    return { data: { id: project.id, version: savedVersion } };
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
  tags?: string[];
  category?: string;
  visibility?: 'private' | 'public' | 'unlisted';
  version?: number;
  metadata?: Record<string, unknown>;
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

    const typedRow = row as ProjectRow;
    console.log(
      loadedFrom === 'data'
        ? '✅ Loading from data (editor state)'
        : '⚠️ Loading from contract (wizard state)'
    );
    console.log(`📊 Version: ${typedRow.version ?? 1}, Category: ${typedRow.category ?? 'general'}, Tags: ${typedRow.tags?.join(', ') || 'none'}`);

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








