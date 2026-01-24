import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects - List user's projects
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch user's projects (RLS automatically filters by user_id)
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, description, thumbnail, is_public, created_at, updated_at')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ projects });
  } catch (err) {
    console.error('Exception in GET /api/projects:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, description, thumbnail, html_content, css_content, components, styles, assets, settings } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // Insert project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
        thumbnail,
        html_content,
        css_content,
        components,
        styles,
        assets,
        settings: settings || {}
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create project:', error);
      return NextResponse.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error('Exception in POST /api/projects:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
