/**
 * Preview API Route
 * 
 * Generate watermarked preview URLs for projects.
 * Enforces watermarks for demo mode and free tier users.
 * 
 * Stage 4 Module 11: Monetization
 */

import { NextRequest, NextResponse } from 'next/server';
import { shouldApplyWatermark } from '@/lib/utils/watermark';
import { buildStandalonePage } from '@/lib/parser/builder';
import { Project } from '@/lib/types/project';
import { getCurrentUser } from '@/lib/supabase/auth';

/**
 * Generate obfuscated dev tools detection script (server-side version)
 */
function generateObfuscatedDevToolsScript(isRTL: boolean = false): string {
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  const transformX = isRTL ? '50%' : '-50%';
  const positionProp = isRTL ? 'right' : 'left';
  const threshold = 160;
  const interval = 500;
  
  // Minified and obfuscated script
  return `
(function(){var a=document,b=a.createElement('div');b.id='watermark-overlay';b.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;direction:${dir};background:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(0,0,0,0.03) 10px,rgba(0,0,0,0.03) 20px);';var c=a.createElement('div');c.textContent='I AM RUNNING - DEMO';c.style.cssText='position:absolute;top:50%;${positionProp}:50%;transform:translate(${transformX},-50%) rotate(-45deg);font-size:48px;font-weight:bold;color:rgba(0,0,0,0.1);white-space:nowrap;user-select:none;text-align:${textAlign};';b.appendChild(c);a.body.appendChild(b);var d=false,e=${threshold};setInterval(function(){if(window.outerHeight-window.innerHeight>e||window.outerWidth-window.innerWidth>e){if(!d){d=true;if(window.parent!==window){window.parent.postMessage({type:'devtools-detected'},'*');}}}else{d=false;}},${interval});a.addEventListener('contextmenu',function(f){f.preventDefault();});a.addEventListener('keydown',function(f){if(f.key==='F12'||(f.ctrlKey&&f.shiftKey&&(f.key==='I'||f.key==='J'))||(f.ctrlKey&&f.key==='U')){f.preventDefault();return false;}});})();
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, pageIndex = 0, locale = 'en' } = body;

    if (!project) {
      return NextResponse.json(
        { error: 'Project data is required' },
        { status: 400 }
      );
    }

    // Validate project structure
    const projectData = project as Project;
    if (!projectData.pages || projectData.pages.length === 0) {
      return NextResponse.json(
        { error: 'Project must have at least one page' },
        { status: 400 }
      );
    }

    const page = projectData.pages[pageIndex || 0];
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Check if RTL language
    const isRTL = locale === 'he' || locale === 'ar' || projectData.settings?.language === 'he' || projectData.settings?.language === 'ar';

    // Build HTML for the page
    const html = buildStandalonePage(page, projectData);

    // Check if watermark should be applied
    const applyWatermark = await shouldApplyWatermark();

    // Build full HTML document
    let fullHtml: string;
    if (applyWatermark) {
      // Generate watermarked HTML (server-side version)
      const watermarkOverlay = `
        <div id="watermark-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          direction: ${isRTL ? 'rtl' : 'ltr'};
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.03) 10px,
            rgba(0, 0, 0, 0.03) 20px
          );
        ">
          <div style="
            position: absolute;
            top: 50%;
            ${isRTL ? 'right' : 'left'}: 50%;
            transform: translate(${isRTL ? '50%' : '-50%'}, -50%) rotate(-45deg);
            font-size: 48px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.1);
            white-space: nowrap;
            user-select: none;
            text-align: ${isRTL ? 'right' : 'left'};
          ">
            I AM RUNNING - DEMO
          </div>
        </div>
      `;
      
      // Obfuscated dev tools detection script
      const devToolsScript = generateObfuscatedDevToolsScript(isRTL);
      
      fullHtml = `
        <!DOCTYPE html>
        <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'he' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${page.title || page.name}</title>
        </head>
        <body style="margin:0;padding:0;direction:${isRTL ? 'rtl' : 'ltr'}">
          ${html}
          ${watermarkOverlay}
          <script>
            ${devToolsScript}
          </script>
        </body>
        </html>
      `;
    } else {
      // Non-watermarked preview (paid users)
      fullHtml = `
        <!DOCTYPE html>
        <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'he' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${page.title || page.name}</title>
        </head>
        <body style="margin:0;padding:0;direction:${isRTL ? 'rtl' : 'ltr'}">
          ${html}
        </body>
        </html>
      `;
    }

    // Return HTML content - client will create blob URL
    return NextResponse.json({
      success: true,
      html: fullHtml,
      watermarked: applyWatermark,
      isRTL,
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for server-side preview generation
 * Used when client-side blob URLs are not available
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0', 10);
    const locale = searchParams.get('locale') || 'en';

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Get user to check package status
    const user = await getCurrentUser();
    
    // Load project from Supabase (if needed)
    // For now, return error as this requires project data
    return NextResponse.json(
      { error: 'Use POST endpoint with project data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Preview GET error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

