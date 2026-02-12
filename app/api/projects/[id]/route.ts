/**
 * Projects API - One-Way Ejection
 * GET: Load project data (prefers data over contract)
 * POST: Save project data (writes ONLY to data field)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
    }

    const hasData = project.data && typeof project.data === 'object' && Object.keys(project.data).length > 0;
    const projectData = hasData ? project.data : project.contract;

    return NextResponse.json({ data: projectData ?? {} });
  } catch (error) {
    console.error('[API projects] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data } = body;

    const { error } = await supabase
      .from('projects')
      .update({
        data: data ?? null,
        source: 'editor',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API projects] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
