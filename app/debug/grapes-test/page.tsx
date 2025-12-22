'use client';

import { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';

export default function GrapesTestPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [importedHtml, setImportedHtml] = useState<string>('');
  const [importedCss, setImportedCss] = useState<string>('');
  const [editor, setEditor] = useState<grapesjs.Editor | null>(null);

  // Load imported HTML from localStorage or test data
  useEffect(() => {
    // Try to load from localStorage (set by editor after import)
    const savedProject = localStorage.getItem('currentProject');
    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        const firstPage = project.pages?.[0];
        if (firstPage) {
          // Build HTML from components
          const htmlFromComponents = firstPage.components
            ?.map((comp: any) => comp.props?.html || '')
            .filter(Boolean)
            .join('\n') || '';
          
          // Combine global and page styles
          const css = [
            project.globalStyles || '',
            firstPage.styles || ''
          ].filter(Boolean).join('\n');
          
          setImportedHtml(htmlFromComponents || firstPage.html || '');
          setImportedCss(css);
        }
      } catch (e) {
        console.error('Failed to parse saved project:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('🔍 GrapesJS version:', grapesjs.version || 'unknown');

    // Initialize GrapesJS with minimal config (matching working version)
    const grapesEditor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: 'auto',
      storageManager: false,
      allowScripts: 1,
      
      // Critical settings from working version
      dragMode: 'absolute',
      dragAutoScroll: 1,
      dragMultipleComponent: 1,
      
      canvas: {
        styles: [], // Empty - only for external URLs
        scripts: [],
        frameStyle: `
          body {
            min-height: 5000px;
            position: relative;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          * {
            box-sizing: border-box;
          }
        `
      },
      
      // CRITICAL: Clear ALL default blocks and add only test blocks
      blockManager: {
        blocks: [
          {
            id: 'simple-test',
            label: 'Simple Test',
            content: '<div style="padding: 20px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px;">SIMPLE TEST</div>'
          },
          {
            id: 'class-test', 
            label: 'Class Test',
            content: '<div class="test-class" style="background: blue; padding: 20px; color: white;">CLASS TEST</div>'
          }
        ]
      },
      
      panels: { defaults: [] },
      
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px' },
          { id: 'mobile', name: 'Mobile', width: '375px' }
        ]
      }
    });

    setEditor(grapesEditor);

    // CRITICAL: Remove ALL default GrapesJS blocks (arrows, text, images, etc.)
    // This must be done AFTER init
    setTimeout(() => {
      const blockManager = grapesEditor.BlockManager;
      const allBlocks = blockManager.getAll();
      
      // Get IDs of blocks to keep
      const keepBlocks = ['simple-test', 'class-test'];
      
      // Remove all blocks except our test blocks
      allBlocks.forEach((block: any) => {
        const blockId = block.getId();
        if (!keepBlocks.includes(blockId)) {
          try {
            blockManager.remove(blockId);
            console.log(`Removed default block: ${blockId}`);
          } catch (e) {
            // Some blocks might not be removable, ignore
          }
        }
      });
      
      console.log('✅ Default blocks cleared, only test blocks remain');
    }, 100);

    // Load imported HTML into canvas when available
    if (importedHtml) {
      // Wait for canvas to be ready
      const loadHtml = () => {
        const frame = grapesEditor.Canvas.getFrameEl();
        if (frame && frame.contentDocument && frame.contentDocument.body) {
          console.log('Loading imported HTML into canvas...');
          console.log('HTML length:', importedHtml.length);
          console.log('CSS length:', importedCss.length);
          
          try {
            // Set CSS first
            if (importedCss) {
              grapesEditor.setStyle(importedCss);
            }
            
            // Set HTML components
            grapesEditor.setComponents(importedHtml);
            
            console.log('✅ Imported HTML loaded into canvas');
          } catch (error) {
            console.error('Failed to load imported HTML:', error);
          }
        } else {
          // Retry after canvas is ready
          setTimeout(loadHtml, 200);
        }
      };
      
      // Wait a bit for editor to fully initialize
      setTimeout(loadHtml, 500);
    }

    // Log component events
    grapesEditor.on('component:add', (component) => {
      console.log('✅ Component added:', component.toHTML());
    });

    grapesEditor.on('component:update', (component, property) => {
      console.log('🔄 Component updated:', property, component.toHTML());
    });

    grapesEditor.on('component:selected', (component) => {
      console.log('📌 Component selected:', component.get('tagName'));
    });

    return () => grapesEditor.destroy();
  }, [containerRef.current]);

  // Reload HTML when imported data changes
  useEffect(() => {
    if (editor && importedHtml) {
      const frame = editor.Canvas.getFrameEl();
      if (frame && frame.contentDocument && frame.contentDocument.body) {
        console.log('Updating canvas with new imported HTML...');
        try {
          if (importedCss) {
            editor.setStyle(importedCss);
          }
          editor.setComponents(importedHtml);
        } catch (error) {
          console.error('Failed to update canvas:', error);
        }
      }
    }
  }, [editor, importedHtml, importedCss]);

  // Handle file import for testing
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.zip')) {
      alert('Please select a ZIP file');
      return;
    }

    try {
      // Import via API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parser', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      if (data.project) {
        const firstPage = data.project.pages?.[0];
        if (firstPage) {
          // Build HTML from components
          const htmlFromComponents = firstPage.components
            ?.map((comp: any) => comp.props?.html || '')
            .filter(Boolean)
            .join('\n') || '';
          
          const css = [
            data.project.globalStyles || '',
            firstPage.styles || ''
          ].filter(Boolean).join('\n');
          
          setImportedHtml(htmlFromComponents || firstPage.html || '');
          setImportedCss(css);
          
          // Fix image paths - convert data URLs to proper format
          let fixedHtml = htmlFromComponents || firstPage.html || '';
          
          // Replace broken image paths with data URLs from assets
          if (data.project.assets) {
            data.project.assets.forEach((asset: any) => {
              // Replace relative paths with data URLs
              const fileName = asset.name.split('/').pop() || asset.name;
              const regex = new RegExp(`(src|href)=["']([^"']*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})["']`, 'gi');
              fixedHtml = fixedHtml.replace(regex, `$1="${asset.url}"`);
            });
          }
          
          setImportedHtml(fixedHtml);
          
          console.log('✅ ZIP imported, HTML loaded');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import ZIP file');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <h1 className="text-2xl font-bold mb-2">GrapesJS Debug - Imported Site Test</h1>
        <div className="flex gap-4 items-center">
          <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            📦 Import ZIP
            <input
              type="file"
              accept=".zip"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          {importedHtml && (
            <span className="text-green-600">✅ HTML loaded ({importedHtml.length} chars)</span>
          )}
          {!importedHtml && (
            <span className="text-gray-500">No imported HTML - import a ZIP file or load from editor</span>
          )}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 border border-gray-300" style={{ minHeight: 0 }}></div>
      <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
        <p>✅ Default blocks cleared (no arrows, text, images blocks)</p>
        <p>✅ Canvas ready for imported HTML</p>
        <p>✅ Drag & drop enabled</p>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
}
