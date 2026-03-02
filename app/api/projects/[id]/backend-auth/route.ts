/**
 * Backend Auth - save Supabase credentials for a project and run migrations.
 * POST body: { supabaseUrl, supabaseAnonKey, serviceRoleKey }
 * Service role key is NEVER stored or logged; used only to validate and run migrations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getProjectRef(supabaseUrl: string): string {
  return supabaseUrl.replace('https://', '').replace('.supabase.co', '').trim();
}

async function executeSql(
  projectRef: string,
  serviceRoleKey: string,
  query: string
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  if (!response.ok) {
    const err = await response.text();
    console.error('[backend-auth] Migration failed:', err);
    return { ok: false, error: err };
  }
  return { ok: true };
}

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

    const projectRef = getProjectRef(supabaseUrl);
    const migrationsResult: Record<string, string> = {};

    const s1 = await executeSql(
      projectRef,
      serviceRoleKey,
      `CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)`
    );
    migrationsResult.profiles_table = s1.ok ? 'ok' : (s1.error ?? 'fail');

    const s2 = await executeSql(projectRef, serviceRoleKey, 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY');
    migrationsResult.rls = s2.ok ? 'ok' : (s2.error ?? 'fail');

    const s3 = await executeSql(
      projectRef,
      serviceRoleKey,
      `DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles'
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$`
    );
    migrationsResult.policies = s3.ok ? 'ok' : (s3.error ?? 'fail');

    const s4 = await executeSql(
      projectRef,
      serviceRoleKey,
      `DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$`
    );
    migrationsResult.policies = s3.ok && s4.ok ? 'ok' : (s3.error ?? s4.error ?? 'fail');

    const s5 = await executeSql(
      projectRef,
      serviceRoleKey,
      `CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`
    );
    migrationsResult.trigger = s5.ok ? 'ok' : (s5.error ?? 'fail');

    const s6 = await executeSql(
      projectRef,
      serviceRoleKey,
      `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user()`
    );
    migrationsResult.trigger = s5.ok && s6.ok ? 'ok' : (s5.error ?? s6.error ?? 'fail');

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
      migrationsResult,
    });
  } catch (error) {
    console.error('[API backend-auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
