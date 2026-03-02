/**
 * Backend Auth - save Supabase credentials for a project and run migrations.
 * POST body: { supabaseUrl, supabaseAnonKey, serviceRoleKey }
 * Service role key is NEVER stored or logged; used only to validate and run migrations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { supabaseUrl, supabaseAnonKey, serviceRoleKey } = body as {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
      serviceRoleKey?: string;
    };

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'supabaseUrl, supabaseAnonKey and serviceRoleKey are required' },
        { status: 400 }
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, metadata')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { success: false, error: fetchError?.message ?? 'Project not found' },
        { status: fetchError?.code === 'PGRST116' ? 404 : 500 }
      );
    }

    try {
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
      const { error: authError } = await adminClient.auth.admin.listUsers({ perPage: 1 });
      if (authError) throw authError;
    } catch (validateErr) {
      return NextResponse.json(
        { success: false, error: 'Invalid Supabase credentials or service role key' },
        { status: 400 }
      );
    }

    const existingMetadata = (project.metadata as Record<string, unknown>) ?? {};
    const updatedMetadata = {
      ...existingMetadata,
      supabase_url: supabaseUrl,
      supabase_anon_key: supabaseAnonKey,
    };

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      supabaseUrl,
      supabaseAnonKey,
    });
  } catch (error) {
    console.error('[API backend-auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
