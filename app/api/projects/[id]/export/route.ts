import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import lz from 'lzutf8';
import { createClient } from '@/lib/supabase/server';
import { craftJsonToHtml } from '@/lib/export/craft-json-to-html';

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

    // 1. Аутентификация
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Получаем проект (паттерн из [id]/route.ts)
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 3. Декомпрессия Craft.js JSON (первая страница)
    const pages = (project.data as { craft?: { pages?: Array<Record<string, unknown>> } } | null)?.craft?.pages ?? [];
    if (!pages.length) {
      return NextResponse.json({ error: 'No pages found' }, { status: 400 });
    }

    const firstPage = pages[0];
    const compressedData = (firstPage.desktopData ?? firstPage.data) as string | undefined;
    if (!compressedData) {
      return NextResponse.json({ error: 'No page data' }, { status: 400 });
    }

    const craftJsonString = lz.decompress(compressedData, { inputEncoding: 'Base64' }) as string;
    if (!craftJsonString) {
      return NextResponse.json({ error: 'Failed to decompress page data' }, { status: 400 });
    }

    // 4. Генерация HTML + CSS
    const { html, css, assets } = craftJsonToHtml(craftJsonString);

    // 5. Скачиваем медиафайлы и добавляем в ZIP
    const zip = new JSZip();
    zip.file('index.html', html);
    zip.file('styles.css', css);

    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
      await Promise.allSettled(
        assets.map(async ({ filename, url }) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              assetsFolder.file(filename, buffer);
            }
          } catch {
            console.warn(`Failed to download asset: ${url}`);
          }
        })
      );
    }

    // 6. Генерируем ZIP
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const projectName = String(project.name ?? 'my-site').toLowerCase().replace(/\s+/g, '-');

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}.zip"`,
      },
    });
  } catch (err) {
    console.error('ZIP export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
