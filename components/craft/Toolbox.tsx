'use client';

import { Element, useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';
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
      { name: 'Container', icon: '▦', component: Container, canvas: true },
      { name: 'Text',      icon: 'T',  component: Text,      canvas: false },
      { name: 'Button',    icon: '▣', component: Button,    canvas: false },
      { name: 'Image',     icon: '🖼', component: Image,     canvas: false },
      { name: 'Divider',   icon: '—',  component: Divider,   canvas: false },
      { name: 'Video',     icon: '▶️', component: Video,     canvas: false },
    ],
  },
  {
    title: 'Sections',
    items: [
      { name: 'Hero',         icon: '◉', component: Hero,         canvas: true },
      { name: 'CTA',          icon: '▶', component: CTA,          canvas: true },
      { name: 'Features',     icon: '✦', component: Features,     canvas: true },
      { name: 'Testimonials', icon: '💬', component: Testimonials, canvas: true },
      { name: 'Pricing',      icon: '💰', component: Pricing,      canvas: true },
      { name: 'FAQ',          icon: '❓', component: FAQ,          canvas: true },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { name: 'Header', icon: '☰', component: Header, canvas: true },
      { name: 'Footer', icon: '▬', component: Footer, canvas: true },
    ],
  },
];

export const Toolbox = () => {
  const { connectors, actions, query } = useEditor();
  const { t } = useEditorTheme();
  const [activeTab, setActiveTab] = useState<TabId>('components');

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
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg cursor-grab
                        border hover:bg-[#FF6B35]/10 hover:border-[#FF6B35]/40 hover:text-[#FF6B35]
                        active:scale-95 transition-all duration-150 select-none ${t(
                          'bg-gray-50 border-gray-200 text-gray-600',
                          'bg-gray-800/60 border-gray-700/40 text-gray-300'
                        )}`}
                    >
                      <span className="text-lg leading-none">{item.icon}</span>
                      <span className="text-[10px] font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'presets' && (
          <div className="space-y-3">
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
