/**
 * Upload base64 images from parsed HTML pages to Supabase Storage,
 * replacing data URLs with public Supabase URLs.
 */
import { getSupabaseClient } from '@/lib/supabase/client';

const BUCKET = 'project-assets';

function base64ToBlob(dataUrl: string): { blob: Blob; ext: string } | null {
  const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return null;
  const ext = m[1] === 'svg+xml' ? 'svg' : m[1];
  const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  return { blob: new Blob([bytes], { type: `image/${m[1]}` }), ext };
}

export async function uploadParsedImages(
  projectId: string,
  pages: Array<{ name: string; html: string; css: string }>,
  sharedCss: string,
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ pages: Array<{ name: string; html: string; css: string }>; css: string }> {
  const supabase = getSupabaseClient();
  const dataUrlRegex = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;

  const allMatches: string[] = [];
  for (const p of pages) {
    const htmlMatches = p.html.match(dataUrlRegex) || [];
    const cssMatches = p.css.match(dataUrlRegex) || [];
    allMatches.push(...htmlMatches, ...cssMatches);
  }
  const sharedCssMatches = sharedCss.match(dataUrlRegex) || [];
  allMatches.push(...sharedCssMatches);

  const unique = [...new Set(allMatches)];
  if (unique.length === 0) return { pages, css: sharedCss };

  const urlMap = new Map<string, string>();
  let uploaded = 0;

  for (const dataUrl of unique) {
    const parsed = base64ToBlob(dataUrl);
    if (!parsed) continue;

    const hash = dataUrl.length.toString(36) + '-' + dataUrl.slice(-20).replace(/[^a-zA-Z0-9]/g, '');
    const path = `${projectId}/images/${hash}.${parsed.ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, parsed.blob, { upsert: true, contentType: parsed.blob.type });

      if (uploadError) {
        console.warn(`[ImageUpload] Failed to upload ${path}:`, uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (urlData?.publicUrl) {
        urlMap.set(dataUrl, urlData.publicUrl);
      }
    } catch (err) {
      console.warn(`[ImageUpload] Error uploading:`, err);
    }

    uploaded++;
    onProgress?.(uploaded, unique.length);
  }

  if (urlMap.size === 0) return { pages, css: sharedCss };

  const replace = (text: string) => {
    let result = text;
    for (const [dataUrl, publicUrl] of urlMap) {
      result = result.replaceAll(dataUrl, publicUrl);
    }
    return result;
  };

  return {
    pages: pages.map(p => ({
      ...p,
      html: replace(p.html),
      css: replace(p.css),
    })),
    css: replace(sharedCss),
  };
}
