import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const slug = String(profile?.email ?? user.email ?? user.id)
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30) || user.id.slice(0, 30);

    const deployUrl = `https://${slug}.iamrunning.online`;

    await supabase
      .from('projects')
      .update({
        slug,
        published: true,
        deployed_url: deployUrl,
        deployed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, url: deployUrl });
  } catch (err) {
    console.error('Deploy error:', err);
    return NextResponse.json({ error: 'Deploy failed' }, { status: 500 });
  }
}
