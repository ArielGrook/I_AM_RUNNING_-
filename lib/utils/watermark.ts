/**
 * Watermark Utilities
 * 
 * Add watermarks to previews in demo mode and free tier.
 * Supports RTL languages and obfuscated dev tools detection.
 * 
 * Stage 4 Module 11: Monetization
 */

/**
 * Generate watermark overlay HTML with RTL support
 */
export function generateWatermarkOverlay(isRTL: boolean = false): string {
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  
  return `
    <div id="watermark-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      direction: ${dir};
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
        text-align: ${textAlign};
      ">
        I AM RUNNING - DEMO
      </div>
    </div>
  `;
}

/**
 * Generate obfuscated dev tools detection script
 * Uses minified code with obfuscated variable names to make it harder to bypass
 */
function generateObfuscatedDevToolsScript(isRTL: boolean = false): string {
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  const transformX = isRTL ? '50%' : '-50%';
  const positionProp = isRTL ? 'right' : 'left';
  
  // Obfuscated variable names (using hex and base36)
  const v1 = 'a' + Math.random().toString(36).substr(2, 5);
  const v2 = 'b' + Math.random().toString(36).substr(2, 5);
  const v3 = 'c' + Math.random().toString(36).substr(2, 5);
  const v4 = 'd' + Math.random().toString(36).substr(2, 5);
  const v5 = 'e' + Math.random().toString(36).substr(2, 5);
  const v6 = 'f' + Math.random().toString(36).substr(2, 5);
  const threshold = 160;
  const interval = 500;
  
  // Minified and obfuscated script
  return `
(function(){var ${v1}=document,${v2}=${v1}.createElement('div');${v2}.id='watermark-overlay';${v2}.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;direction:${dir};background:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(0,0,0,0.03) 10px,rgba(0,0,0,0.03) 20px);';var ${v3}=${v1}.createElement('div');${v3}.textContent='I AM RUNNING - DEMO';${v3}.style.cssText='position:absolute;top:50%;${positionProp}:50%;transform:translate(${transformX},-50%) rotate(-45deg);font-size:48px;font-weight:bold;color:rgba(0,0,0,0.1);white-space:nowrap;user-select:none;text-align:${textAlign};';${v2}.appendChild(${v3});${v1}.body.appendChild(${v2});var ${v4}=false,${v5}=${threshold};setInterval(function(){if(window.outerHeight-window.innerHeight>${v5}||window.outerWidth-window.innerWidth>${v5}){if(!${v4}){${v4}=true;if(window.parent!==window){window.parent.postMessage({type:'devtools-detected'},'*');}}}else{${v4}=false;}},${interval});${v1}.addEventListener('contextmenu',function(${v6}){${v6}.preventDefault();});${v1}.addEventListener('keydown',function(${v6}){if(${v6}.key==='F12'||(${v6}.ctrlKey&&${v6}.shiftKey&&(${v6}.key==='I'||${v6}.key==='J'))||(${v6}.ctrlKey&&${v6}.key==='U')){${v6}.preventDefault();return false;}});})();
  `.trim();
}

/**
 * Inject watermark script into iframe
 * Auto-closes on inspect (dev tools) with obfuscated detection
 */
export function injectWatermarkScript(iframe: HTMLIFrameElement, isRTL: boolean = false): void {
  if (!iframe.contentWindow) return;

  const script = generateObfuscatedDevToolsScript(isRTL);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      const scriptEl = doc.createElement('script');
      scriptEl.textContent = script;
      doc.body.appendChild(scriptEl);
    }
  } catch (error) {
    // Cross-origin restriction - watermark added via CSS overlay instead
    console.warn('Cannot inject script into iframe:', error);
  }
}

/**
 * Create watermarked preview URL with RTL support
 */
export function createWatermarkedPreviewUrl(html: string, isRTL: boolean = false): string {
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  const transformX = isRTL ? '50%' : '-50%';
  const positionProp = isRTL ? 'right' : 'left';
  
  const watermarkOverlay = generateWatermarkOverlay(isRTL);
  const obfuscatedScript = generateObfuscatedDevToolsScript(isRTL);
  
  const watermarkedHtml = `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${isRTL ? 'he' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          direction: ${dir};
        }
        #watermark-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          direction: ${dir};
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.03) 10px,
            rgba(0, 0, 0, 0.03) 20px
          );
        }
        #watermark-text {
          position: absolute;
          top: 50%;
          ${positionProp}: 50%;
          transform: translate(${transformX}, -50%) rotate(-45deg);
          font-size: 48px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.1);
          white-space: nowrap;
          user-select: none;
          text-align: ${textAlign};
        }
      </style>
    </head>
    <body>
      ${html}
      ${watermarkOverlay}
      <script>
        ${obfuscatedScript}
      </script>
    </body>
    </html>
  `;

  // Create blob URL
  const blob = new Blob([watermarkedHtml], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

/**
 * Check if watermark should be applied based on user package and demo mode
 */
export async function shouldApplyWatermark(): Promise<boolean> {
  // Dynamic import to avoid circular dependencies
  const { getUserPackage } = await import('@/lib/utils/user-package');
  const { isDemoMode } = await import('@/lib/utils/demo-mode');
  
  const userPackage = await getUserPackage();
  const isDemo = isDemoMode();
  
  // Apply watermark if:
  // 1. User is in demo mode (no package)
  // 2. User has free tier (no package)
  return !userPackage || isDemo;
}





