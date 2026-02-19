/**
 * Projects CRUD — client-side Supabase operations
 * Follows One-Way Ejection: wizard → contract, editor → data
 */

import { createSupabaseClient } from '@/lib/supabase/client';

export type ProjectSource = 'interactive' | 'editor';
export type ProjectStatus = 'draft' | 'paid' | 'deployed' | 'expired';

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  source: ProjectSource;
  status: ProjectStatus;
  contract: Record<string, unknown> | null;
  data: Record<string, unknown> | null;
  preview_token: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  source?: ProjectSource;
  contract?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  thumbnail?: string;
  contract?: Record<string, unknown>;
  data?: Record<string, unknown>;
  status?: ProjectStatus;
}

/** List all projects for the current authenticated user */
export async function getProjects(): Promise<{ data: ProjectRow[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, user_id, name, description, thumbnail, source, status, contract, data, preview_token, version, created_at, updated_at'
    )
    .order('updated_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as ProjectRow[], error: null };
}

/** Get a single project by ID */
export async function getProject(
  id: string
): Promise<{ data: ProjectRow | null; error: string | null }> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, user_id, name, description, thumbnail, source, status, contract, data, preview_token, version, created_at, updated_at'
    )
    .eq('id', id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ProjectRow, error: null };
}

/** Create a new project — wizard starts with source='interactive', contract set, data=null */
export async function createProject(
  input: CreateProjectInput
): Promise<{ data: ProjectRow | null; error: string | null }> {
  const supabase = createSupabaseClient();

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userData.user.id,
      name: input.name,
      description: input.description ?? null,
      source: input.source ?? 'interactive',
      status: 'draft',
      contract: input.contract ?? {},
      data: null,
    })
    .select(
      'id, user_id, name, description, thumbnail, source, status, contract, data, preview_token, version, created_at, updated_at'
    )
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ProjectRow, error: null };
}

/** Update project fields — partial patch */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<{ data: ProjectRow | null; error: string | null }> {
  const supabase = createSupabaseClient();

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.thumbnail !== undefined) patch.thumbnail = input.thumbnail;
  if (input.status !== undefined) patch.status = input.status;

  if (input.contract !== undefined) patch.contract = input.contract;

  if (input.data !== undefined) {
    patch.data = input.data;
    patch.source = 'editor';
  }

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select(
      'id, user_id, name, description, thumbnail, source, status, contract, data, preview_token, version, created_at, updated_at'
    )
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ProjectRow, error: null };
}

/** Save wizard contract step — only writes to contract, never to data */
export async function saveWizardStep(
  id: string,
  contractPatch: Record<string, unknown>
): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('contract, source')
    .eq('id', id)
    .single();

  if (fetchError) return { error: fetchError.message };

  if (existing?.source === 'editor') {
    return { error: 'Cannot modify contract after editor save (One-Way Ejection)' };
  }

  const merged = { ...(existing?.contract ?? {}), ...contractPatch };

  const { error } = await supabase
    .from('projects')
    .update({ contract: merged })
    .eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

/** Delete a project */
export async function deleteProject(id: string): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

/** Duplicate a project (copies name + contract, data stays null, source resets to interactive) */
export async function duplicateProject(
  id: string
): Promise<{ data: ProjectRow | null; error: string | null }> {
  const { data: source, error: fetchError } = await getProject(id);
  if (fetchError || !source) return { data: null, error: fetchError ?? 'Project not found' };

  return createProject({
    name: `${source.name} (copy)`,
    description: source.description ?? undefined,
    source: 'interactive',
    contract: source.contract ?? {},
  });
}
