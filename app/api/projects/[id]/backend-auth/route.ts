/**
 * Backend Auth - save Supabase credentials for a project and run migrations.
 * POST body: { supabaseUrl, supabaseAnonKey, serviceRoleKey, dbPassword }
 * GET returns saved credentials from project.backend_blocks.user_auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Client } from 'pg';

async function runMigrations(
  supabaseUrl: string,
  dbPassword: string
): Promise<Record<string, string>> {
  const projectRef = supabaseUrl
    .replace('https://', '')
    .replace('.supabase.co', '')
    .replace(/\/$/, '');
  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const statements: { key: string; sql: string }[] = [
    {
      key: 'profiles_table',
      sql: `CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
    },
    { key: 'rls', sql: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY` },
    {
      key: 'policy_select',
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
          AND policyname='Users can read own profile')
        THEN CREATE POLICY "Users can read own profile"
          ON public.profiles FOR SELECT USING (auth.uid() = id);
        END IF; END $$`,
    },
    {
      key: 'policy_update',
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
          AND policyname='Users can update own profile')
        THEN CREATE POLICY "Users can update own profile"
          ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
        END IF; END $$`,
    },
    {
      key: 'policy_insert',
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
          AND policyname='Users can insert own profile')
        THEN CREATE POLICY "Users can insert own profile"
          ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
        END IF; END $$`,
    },
    {
      key: 'function',
      sql: `CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.email, '')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,
    },
    {
      key: 'trigger',
      sql: `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user()`,
    },
    {
      key: 'storage_rls',
      sql: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY`,
    },
    {
      key: 'storage_select',
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can view own media')
        THEN CREATE POLICY "Users can view own media" ON storage.objects FOR SELECT USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
        END IF; END $$`,
    },
    {
      key: 'storage_insert',
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own media')
        THEN CREATE POLICY "Users can upload own media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
        END IF; END $$`,
    },
    {
      key: 'storage_delete',
      sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own media')
        THEN CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
        END IF; END $$`,
    },
  ];

  const results: Record<string, string> = {};
  for (const { key, sql } of statements) {
    try {
      await client.query(sql);
      results[key] = 'ok';
    } catch (err) {
      console.error(`[backend-auth] Migration ${key} failed:`, err);
      results[key] = err instanceof Error ? err.message : 'error';
    }
  }
  await client.end();
  return results;
}

export async function GET(
  _request: NextRequest,
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
    const { data: project, error } = await supabase
      .from('projects')
      .select('backend_blocks')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    if (error || !project) {
      return NextResponse.json(
        { error: error?.message ?? 'Project not found' },
        { status: error?.code === 'PGRST116' ? 404 : 500 }
      );
    }
    const blocks = (project.backend_blocks as Record<string, unknown>) ?? {};
    const userAuth = blocks.user_auth as Record<string, unknown> | undefined;
    if (!userAuth) {
      return NextResponse.json({});
    }
    return NextResponse.json({
      supabaseUrl: userAuth.supabaseUrl ?? null,
      supabaseAnonKey: userAuth.supabaseAnonKey ?? null,
      serviceRoleKey: userAuth.supabaseServiceKey ?? null,
      dbPassword: userAuth.dbPassword ?? null,
    });
  } catch (e) {
    console.error('[API backend-auth GET] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
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
    const { supabaseUrl, supabaseAnonKey, serviceRoleKey, dbPassword } = body as {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
      serviceRoleKey?: string;
      dbPassword?: string;
    };

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'supabaseUrl, supabaseAnonKey and serviceRoleKey are required' },
        { status: 400 }
      );
    }
    if (!dbPassword || !String(dbPassword).trim()) {
      return NextResponse.json(
        { success: false, error: 'Database password is required for migrations' },
        { status: 400 }
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, metadata, backend_blocks')
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

    const migrationsResult = await runMigrations(supabaseUrl.trim(), String(dbPassword).trim());

    // Создаём Storage бакет media если не существует
    const adminClient = createSupabaseClient(supabaseUrl.trim(), serviceRoleKey.trim(), {
      auth: { persistSession: false },
    });
    try {
      const { data: buckets } = await adminClient.storage.listBuckets();
      const mediaExists = buckets?.some((b) => b.name === 'media');
      if (!mediaExists) {
        await adminClient.storage.createBucket('media', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'],
        });
      }
    } catch (bucketErr) {
      console.error('[backend-auth] Storage bucket creation failed:', bucketErr);
    }

    const existingBlocks = (project.backend_blocks as Record<string, unknown>) ?? {};
    const updatedBackendBlocks = {
      ...existingBlocks,
      user_auth: {
        enabled: true,
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
        supabaseServiceKey: serviceRoleKey.trim(),
        dbPassword: dbPassword.trim(),
      },
    };

    const existingMetadata = (project.metadata as Record<string, unknown>) ?? {};
    const updatedMetadata = {
      ...existingMetadata,
      supabase_url: supabaseUrl.trim(),
      supabase_anon_key: supabaseAnonKey.trim(),
    };

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        metadata: updatedMetadata,
        backend_blocks: updatedBackendBlocks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
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
