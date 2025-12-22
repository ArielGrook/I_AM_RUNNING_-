'use client';

import { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';

export default function GrapesTestPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('🔍 GrapesJS version:', grapesjs.version || 'unknown');

    // CLEAN GrapesJS WITHOUT preset-webpage
    const editor = grapesjs.init({
      container: containerRef.current,
      height: '400px',
      width: 'auto',
      
      // NO preset-webpage plugin!
      plugins: [],
      
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
            content: '<div class="test-class">CLASS TEST</div>'
          }
        ]
      },
      
      // Add CSS for class-test
      canvas: {
        styles: [
          '.test-class { background: blue; padding: 20px; color: white; }'
        ]
      }
    });

    // Log EVERYTHING
    editor.on('component:add', (component) => {
      console.log('✅ Component added:', component.toHTML());
    });

    editor.on('component:update', (component, property) => {
      console.log('🔄 Component updated:', property, component.toHTML());
    });

    return () => editor.destroy();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GrapesJS Version Test</h1>
      <p className="mb-4">Testing GrapesJS without preset-webpage</p>
      <div ref={containerRef} className="border border-gray-300"></div>
      <p className="mt-4 text-sm text-gray-600">
        Check browser console for GrapesJS version and component logs
      </p>
    </div>
  );
}

