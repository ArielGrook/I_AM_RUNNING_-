'use client';

import { Element, useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import {
  Container,
  Text,
  Hero,
  Button,
  Image,
  Header,
  CTA,
  Features,
  Footer,
  Testimonials,
  Pricing,
  FAQ,
  Divider,
  Video,
  HtmlBlock,
} from '@/lib/craft/components';
import { PRESETS } from '@/lib/craft/presets';
import { useEditorTheme } from './EditorThemeContext';

const ROOT_ID = 'ROOT';
type TabId = 'components' | 'presets';

const tabs: { id: TabId; label: string }[] = [
  { id: 'components', label: 'Components' },
  { id: 'presets', label: '⚡ Presets' },
];

const categories = [
  {
    title: 'Basic',
    items: [
      { name: 'Container', label: 'Container', icon: '▦', component: Container, canvas: true, previewBg: '#1e293b' },
      { name: 'Text',      label: 'Text',      icon: 'T',  component: Text,      canvas: false, previewBg: '#ffffff' },
      { name: 'Button',    label: 'Button',   icon: '▣', component: Button,    canvas: false, previewBg: '#FF6B35' },
      { name: 'Image',     label: 'Image',    icon: '🖼', component: Image,     canvas: false, previewBg: '#374151' },
      { name: 'Divider',   label: 'Divider',  icon: '—',  component: Divider,   canvas: false, previewBg: '#1e293b' },
      { name: 'Video',     label: 'Video',    icon: '▶️', component: Video,     canvas: false, previewBg: '#374151' },
    ],
  },
  {
    title: 'Sections',
    items: [
      { name: 'Hero',         label: 'Hero',         icon: '◉', component: Hero,         canvas: true, previewBg: '#0f172a' },
      { name: 'CTA',          label: 'CTA',          icon: '▶', component: CTA,          canvas: true, previewBg: '#FF6B35' },
      { name: 'Features',     label: 'Features',     icon: '✦', component: Features,     canvas: true, previewBg: '#0f172a' },
      { name: 'Testimonials', label: 'Testimonials', icon: '💬', component: Testimonials, canvas: true, previewBg: '#0a0f1e' },
      { name: 'Pricing',      label: 'Pricing',      icon: '💰', component: Pricing,      canvas: true, previewBg: '#0f172a' },
      { name: 'FAQ',          label: 'FAQ',          icon: '❓', component: FAQ,          canvas: true, previewBg: '#0a0f1e' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { name: 'Header', label: 'Header', icon: '☰', component: Header, canvas: true, previewBg: '#0a0f1e' },
      { name: 'Footer', label: 'Footer', icon: '▬', component: Footer, canvas: true, previewBg: '#020617' },
    ],
  },
];

export const Toolbox = () => {
  const { connectors, actions, query } = useEditor();
  const { t } = useEditorTheme();
  const [activeTab, setActiveTab] = useState<TabId>('components');
  const [importing, setImporting] = useState(false);

  const handleZipImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/parser?format=craft', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        const blocks = data.blocks as Array<{ blockType: string; label: string; rawHtml: string; rawCss: string }> | undefined;
        if (!res.ok || !Array.isArray(blocks)) {
          throw new Error(data.error || 'Invalid response');
        }
        blocks.forEach((block, index) => {
          const tree = query
            .parseReactElement(
              React.createElement(HtmlBlock, {
                rawHtml: block.rawHtml,
                rawCss: block.rawCss,
                blockType: block.blockType,
                label: block.label,
              })
            )
            .toNodeTree();
          actions.addNodeTree(tree, ROOT_ID, index);
        });
      } catch (err) {
        console.error('ZIP import failed:', err);
        alert('Failed to parse ZIP. Check console.');
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    },
    [query, actions]
  );

  const loadPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      try {
        const state = query.getState();
        const nodeCount = Object.keys(state?.nodes ?? {}).length;
        if (nodeCount > 1) {
          const ok = window.confirm(
            'This will replace your current canvas. Continue?'
          );
          if (!ok) return;
        }

        const rootNode = state?.nodes?.[ROOT_ID];
        const childIds = (rootNode?.data?.nodes ?? []) as string[];
        [...childIds].reverse().forEach((id) => actions.delete(id));

        const elements = preset.getElements();
        elements.forEach((element, index) => {
          const tree = query.parseReactElement(element).toNodeTree();
          actions.addNodeTree(tree, ROOT_ID, index);
        });
      } catch (err) {
        console.error('Load preset failed:', err);
      }
    },
    [query, actions]
  );

  return (
    <div className={`w-60 border-r overflow-y-auto shrink-0 flex flex-col ${t(
      'bg-white border-gray-200',
      'bg-[#1e1e1e] border-gray-700/60'
    )}`}>
      <div className={`flex border-b shrink-0 ${t('border-gray-200', 'border-gray-700/60')}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
                : t('text-gray-500 hover:text-gray-700', 'text-gray-400 hover:text-gray-200')
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-3 flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'components' && (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat.title}>
                <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 px-1 ${t('text-gray-400', 'text-gray-500')}`}>
                  {cat.title}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {cat.items.map((item) => (
                    <div
                      key={item.name}
                      ref={(ref) => {
                        if (ref) {
                          connectors.create(
                            ref,
                            React.createElement(Element, {
                              is: item.component,
                              canvas: item.canvas,
                            })
                          );
                        }
                      }}
                      className={`group relative cursor-grab active:cursor-grabbing rounded-lg border border-gray-700
                        hover:border-orange-500 overflow-hidden transition-all select-none ${t(
                          'bg-gray-50 border-gray-200',
                          'bg-gray-800/60 border-gray-700/40'
                        )}`}
                    >
                      <div
                        style={{ background: item.previewBg ?? '#1e293b', height: 48 }}
                        className="w-full flex items-center justify-center"
                      >
                        <span style={{ fontSize: 20 }}>{item.icon}</span>
                      </div>
                      <div className={`px-2 py-1.5 text-xs font-medium transition-colors ${t(
                        'text-gray-600 group-hover:text-gray-900',
                        'text-gray-300 group-hover:text-white'
                      )}`}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <label
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed transition-colors text-sm cursor-pointer ${t(
                'border-gray-600 hover:border-orange-500 text-gray-400 hover:text-orange-400',
                'border-gray-600 hover:border-orange-500 text-gray-400 hover:text-orange-400'
              )}`}
            >
              <Upload size={14} />
              Import ZIP
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleZipImport}
                disabled={importing}
              />
            </label>
            {importing && (
              <div className="text-xs text-gray-500 text-center py-2">
                Parsing ZIP...
              </div>
            )}
            {PRESETS.map((preset) => (
              <div
                key={preset.id}
                role="button"
                tabIndex={0}
                onClick={() => loadPreset(preset)}
                onKeyDown={(e) => e.key === 'Enter' && loadPreset(preset)}
                className={`cursor-pointer rounded-xl border transition-all p-4 group ${t(
                  'border-gray-200 hover:border-[#FF6B35] bg-gray-50 hover:bg-gray-100',
                  'border-gray-700 hover:border-[#FF6B35] bg-gray-800 hover:bg-gray-750'
                )}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{preset.thumbnail}</span>
                  <div>
                    <div className={`text-sm font-semibold transition-colors ${t('text-gray-900 group-hover:text-[#FF6B35]', 'text-white group-hover:text-[#ff8555]')}`}>
                      {preset.name}
                    </div>
                    <div className={`text-xs ${t('text-gray-500', 'text-gray-400')}`}>{preset.category}</div>
                  </div>
                </div>
                <p className={`text-xs ${t('text-gray-500', 'text-gray-500')}`}>{preset.description}</p>
                <div className={`mt-3 text-xs text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Click to load →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
