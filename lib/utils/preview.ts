/**
 * Preview Generation Utilities
 * 
 * Generate mini-previews for admin shadow mode.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

import html2canvas from 'html2canvas';
import { getRedisClient } from '@/lib/redis/client';

const PREVIEW_CACHE_PREFIX = 'preview:';
const PREVIEW_CACHE_TTL = 3600; // 1 hour

/**
 * Generate preview from project data
 */
export async function generateProjectPreview(
  projectData: unknown,
  width: number = 400,
  height: number = 300
): Promise<string> {
  try {
    // Convert project data to HTML
    const html = projectDataToHtml(projectData);
    
    // Create temporary container
    const container = document.createElement('div');
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.backgroundColor = '#ffffff';
    container.innerHTML = html;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 0.5, // Smaller scale for mini-previews
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      const dataUrl = canvas.toDataURL('image/png', 0.8);
      return dataUrl;
    } finally {
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Failed to generate preview:', error);
    throw new Error('Failed to generate preview');
  }
}

/**
 * Convert project data to HTML for preview
 * Supports RTL for Hebrew/Arabic projects
 */
function projectDataToHtml(projectData: unknown): string {
  if (!projectData || typeof projectData !== 'object') {
    return '<div>No content</div>';
  }

  const data = projectData as { 
    pages?: Array<{ components?: Array<{ props?: { html?: string } }> }>;
    settings?: { language?: string };
  };
  
  if (!data.pages || data.pages.length === 0) {
    return '<div>Empty project</div>';
  }

  // Get HTML from first page components
  const firstPage = data.pages[0];
  if (!firstPage.components || firstPage.components.length === 0) {
    return '<div>No components</div>';
  }

  const componentsHtml = firstPage.components
    .map(comp => comp.props?.html || '')
    .filter(Boolean)
    .join('');

  // Check if RTL language
  const isRTL = data.settings?.language === 'he' || data.settings?.language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  return `
    <div style="padding: 20px; font-family: system-ui, sans-serif;" dir="${dir}">
      ${componentsHtml || '<div>No content</div>'}
    </div>
  `;
}

/**
 * Get cached preview or generate new one
 */
export async function getCachedPreview(
  projectId: string,
  generator: () => Promise<string>
): Promise<string> {
  const cacheKey = `${PREVIEW_CACHE_PREFIX}${projectId}`;
  const redis = getRedisClient();

  try {
    // Try Redis cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Generate new preview
    const preview = await generator();

    // Cache in Redis
    if (redis) {
      await redis.setex(cacheKey, PREVIEW_CACHE_TTL, preview);
    }

    return preview;
  } catch (error) {
    console.error('Preview caching error:', error);
    // Fallback to generator without cache
    return generator();
  }
}
