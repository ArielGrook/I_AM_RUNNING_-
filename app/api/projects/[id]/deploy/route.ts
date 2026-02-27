import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import { generateProjectZip } from '@/lib/export/craft-json-to-html';

export const runtime = 'nodejs';

const execAsync = promisify(exec);
const SITES_DIR = '/var/www/sites';

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

    // Получить проект (тот же паттерн что в export/route.ts)
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Получить username из профиля
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const username = String(profile?.email ?? user.email ?? user.id)
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30) || user.id.slice(0, 30);

    // Получить ZIP буфер через общий генератор
    const zipBuffer = await generateProjectZip(project);

    // Распаковать в /var/www/sites/username/
    const siteDir = path.join(SITES_DIR, username);
    await fs.mkdir(siteDir, { recursive: true });

    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(siteDir, true);

    // Права для Nginx
    await execAsync(`chown -R www-data:www-data ${siteDir}`);
    await execAsync(`chmod -R 755 ${siteDir}`);

    const deployUrl = `http://${username}.iamrunning.online`;

    // Сохранить URL деплоя в Supabase
    await supabase
      .from('projects')
      .update({ deployed_url: deployUrl, deployed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, url: deployUrl });
  } catch (err) {
    console.error('Deploy error:', err);
    return NextResponse.json({ error: 'Deploy failed' }, { status: 500 });
  }
}

