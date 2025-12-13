import JSZip from 'jszip';
import { Project, Page, Component } from '@/lib/types/project';

// Component to HTML converter
function componentToHtml(component: Component): string {
  // If component has raw HTML in props, use it
  if (component.props?.html) {
    return component.props.html as string;
  }
  
  // Build HTML from component properties
  const tag = component.type || 'div';
  const className = component.props?.className || '';
  const attributes = component.props?.attributes || {};
  
  // Build attribute string
  const attrString = Object.entries(attributes)
    .filter(([key]) => key !== 'className')
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  // Build inline styles if present
  const styleString = component.styles ? 
    `style="${Object.entries(component.styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')}"` : '';
  
  // Build opening tag
  const openTag = `<${tag}${className ? ` class="${className}"` : ''}${attrString ? ` ${attrString}` : ''}${styleString ? ` ${styleString}` : ''}>`;
  
  // Build children if present
  let childrenHtml = '';
  if (component.children && component.children.length > 0) {
    childrenHtml = component.children.map(child => componentToHtml(child)).join('\n');
  } else if (component.props?.text) {
    childrenHtml = component.props.text as string;
  }
  
  // Build closing tag
  const closeTag = `</${tag}>`;
  
  return `${openTag}\n${childrenHtml}\n${closeTag}`;
}

// Page to HTML converter
function pageToHtml(page: Page, project: Project): string {
  // Build components HTML
  const componentsHtml = page.components
    .map(component => componentToHtml(component))
    .join('\n\n');
  
  // Combine page and global styles
  const styles = [
    project.globalStyles || '',
    page.styles || ''
  ].filter(s => s).join('\n');
  
  // Combine page and global scripts
  const scripts = [
    project.globalScripts || '',
    page.scripts || ''
  ].filter(s => s).join('\n');
  
  // Build complete HTML document
  const html = `<!DOCTYPE html>
<html lang="${project.settings?.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title || page.name}</title>
    ${page.description ? `<meta name="description" content="${page.description}">` : ''}
    ${project.settings?.favicon ? `<link rel="icon" href="${project.settings.favicon}">` : ''}
    
    <!-- Tailwind CSS (optional) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    ${styles ? `<style>\n${styles}\n</style>` : ''}
    
    ${generateThemeStyles(project)}
</head>
<body>
    ${componentsHtml}
    
    ${scripts ? `<script>\n${scripts}\n</script>` : ''}
</body>
</html>`;
  
  return html;
}

// Generate theme styles from project settings
function generateThemeStyles(project: Project): string {
  if (!project.settings?.theme) return '';
  
  const theme = project.settings.theme;
  let styles = '<style>\n:root {\n';
  
  // Add color tokens
  if (theme.colors) {
    styles += `  --color-primary: ${theme.colors.primary};\n`;
    styles += `  --color-secondary: ${theme.colors.secondary};\n`;
    styles += `  --color-accent: ${theme.colors.accent};\n`;
    styles += `  --color-background: ${theme.colors.background};\n`;
    styles += `  --color-text: ${theme.colors.text};\n`;
  }
  
  // Add font settings
  if (theme.fonts) {
    if (theme.fonts.heading) {
      styles += `  --font-heading: ${theme.fonts.heading};\n`;
    }
    if (theme.fonts.body) {
      styles += `  --font-body: ${theme.fonts.body};\n`;
    }
  }
  
  styles += '}\n\n';
  
  // Apply theme variables
  styles += `body {
  background-color: var(--color-background, #ffffff);
  color: var(--color-text, #000000);
  font-family: var(--font-body, system-ui, -apple-system, sans-serif);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading, var(--font-body));
}

.text-primary { color: var(--color-primary); }
.bg-primary { background-color: var(--color-primary); }
.text-secondary { color: var(--color-secondary); }
.bg-secondary { background-color: var(--color-secondary); }
.text-accent { color: var(--color-accent); }
.bg-accent { background-color: var(--color-accent); }
</style>`;
  
  return styles;
}

// Build ZIP from Project
export async function buildZip(project: Project): Promise<ArrayBuffer> {
  const zip = new JSZip();
  
  // Add each page as HTML file
  for (const page of project.pages) {
    const html = pageToHtml(page, project);
    const fileName = page.slug === 'index' ? 'index.html' : `${page.slug}.html`;
    zip.file(fileName, html);
  }
  
  // Add global CSS if present
  if (project.globalStyles) {
    zip.file('styles.css', project.globalStyles);
  }
  
  // Add global JS if present
  if (project.globalScripts) {
    zip.file('scripts.js', project.globalScripts);
  }
  
  // Add assets
  if (project.assets && project.assets.length > 0) {
    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
      for (const asset of project.assets) {
        if (asset.url.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(asset.url);
          const blob = await response.blob();
          assetsFolder.file(asset.name, blob);
        } else {
          // External URL - add as reference in a manifest
          // In production, you might want to download and include these
        }
      }
    }
  }
  
  // Add project manifest
  const manifest = {
    name: project.name,
    description: project.description,
    version: project.metadata.version,
    created: project.metadata.createdAt,
    updated: project.metadata.updatedAt,
    pages: project.pages.map(p => ({
      name: p.name,
      slug: p.slug,
      title: p.title
    }))
  };
  
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  
  // Generate ZIP file
  const zipBuffer = await zip.generateAsync({ 
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6 // Balanced compression
    }
  });
  
  return zipBuffer;
}

// Build single page as standalone HTML
export function buildStandalonePage(page: Page, project: Project): string {
  return pageToHtml(page, project);
}

// Export project as JSON
export function exportProjectJson(project: Project): string {
  return JSON.stringify(project, null, 2);
}

// Import project from JSON
export function importProjectJson(json: string): Project {
  const parsed = JSON.parse(json);
  // Validate with schema
  return parsed as Project;
}










