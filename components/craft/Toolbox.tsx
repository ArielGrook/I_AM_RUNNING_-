'use client';

import { Element, useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';
import { Upload, ChevronDown } from 'lucide-react';
import {
  Hero,
  HeroTron,
  HeaderTron,
  TronFeatures,
  TronStats,
  TronPortfolio,
  TronTestimonials,
  TronPricing,
  TronFAQ,
  TronFooter,
  TronContact,
  TronShowcase,
  TronLogin,
  TronRegister,
  TronHub,
  HtmlBlock,
} from '@/lib/craft/components';
import { PRESETS } from '@/lib/craft/presets';
import { Icons } from '@/lib/craft/icons';
import { useEditorTheme } from './EditorThemeContext';
import { toast } from '@/components/ui/Toast';

const ROOT_ID = 'ROOT';
type TabId = 'components' | 'presets';

const tabs: { id: TabId; label: string }[] = [
  { id: 'components', label: 'Components' },
  { id: 'presets', label: '⚡ Presets' },
];

const categories: { key: 'tronSections'; title: string; items: { name: string; label: string; icon: string; component: React.ComponentType<any>; canvas: boolean; newPageName?: string }[] }[] = [
  {
    key: 'tronSections',
    title: 'Legacy (Tron)',
    items: [
      { name: 'HeaderTron', label: 'Header Tron', icon: '▣', component: HeaderTron, canvas: true },
      { name: 'Hero', label: 'Hero Default', icon: '⬡', component: Hero, canvas: true },
      { name: 'HeroTron', label: 'Hero Tron', icon: '◎', component: HeroTron, canvas: true },
      { name: 'TronFeatures', label: 'Tron Features', icon: '◇', component: TronFeatures, canvas: true },
      { name: 'TronStats', label: 'Tron Stats', icon: '▢', component: TronStats, canvas: true },
      { name: 'TronPortfolio', label: 'Tron Portfolio', icon: '▣', component: TronPortfolio, canvas: true },
      { name: 'TronTestimonials', label: 'Tron Testimonials', icon: '💬', component: TronTestimonials, canvas: true },
      { name: 'TronPricing', label: 'Tron Pricing', icon: '💰', component: TronPricing, canvas: true },
      { name: 'TronFAQ', label: 'Tron FAQ', icon: '❓', component: TronFAQ, canvas: true },
      { name: 'TronFooter', label: 'Tron Footer', icon: '▬', component: TronFooter, canvas: true },
      { name: 'TronContact', label: 'Tron Contact', icon: '✉', component: TronContact, canvas: true },
      { name: 'TronShowcase', label: 'Tron Showcase', icon: '▤', component: TronShowcase, canvas: true },
      { name: 'TronLogin', label: 'Tron Login', icon: '🔑', component: TronLogin, canvas: true, newPageName: 'Login' },
      { name: 'TronRegister', label: 'Tron Register', icon: '📝', component: TronRegister, canvas: true, newPageName: 'Register' },
      { name: 'TronHub', label: 'Tron Hub', icon: '◈', component: TronHub, canvas: true, newPageName: 'Dashboard' },
    ],
  },
];

export const Toolbox = ({ onAddPageNamed }: { onAddPageNamed?: (name: string) => void }) => {
  const { connectors, actions, query } = useEditor();
  const { t } = useEditorTheme();
  const [activeTab, setActiveTab] = useState<TabId>('components');
  const [importing, setImporting] = useState(false);
  const [openGroups, setOpenGroups] = useState({ tronSections: true });
  const toggleGroup = (key: 'tronSections') =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const handleAuthComponentClick = useCallback(
    (item: { component: React.ComponentType<any>; canvas: boolean; newPageName?: string }) => {
      if (!item.newPageName || !onAddPageNamed) return;
      onAddPageNamed(item.newPageName);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            const tree = query
              .parseReactElement(
                React.createElement(Element, { is: item.component, canvas: item.canvas })
              )
              .toNodeTree();
            actions.addNodeTree(tree, ROOT_ID, 0);
          } catch (err) {
            console.error('Failed to add auth component:', err);
          }
        });
      });
    },
    [onAddPageNamed, query, actions]
  );

  const loadPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      try {
        const state = query.getState();
        const rootNode = state?.nodes?.[ROOT_ID];
        const childIds = (rootNode?.data?.nodes ?? []) as string[];
        [...childIds].reverse().forEach((id) => actions.delete(id));

        const elements = preset.getElements();
        elements.forEach((element, index) => {
          const tree = query.parseReactElement(element).toNodeTree();
          actions.addNodeTree(tree, ROOT_ID, index);
        });
        toast('Preset loaded', 'warning');
      } catch (err) {
        console.error('Load preset failed:', err);
      }
    },
    [query, actions]
  );

  return (
    <div className={`flex-1 min-w-0 overflow-y-auto flex flex-col craft-editor-left ${t(
      'bg-white',
      'bg-[#1a1a1a]'
    )}`}>
      <div className={`flex border-b shrink-0 ${t('border-gray-200', 'border-[#2a2a2a]')}`}>
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
      <div className="p-3 flex-1 min-h-0 overflow-y-auto craft-editor-left">
        {activeTab === 'components' && (
          <div className="space-y-0">
            {categories.map((cat) => (
              <div key={cat.key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(cat.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider ${t(
                    'text-gray-500 hover:text-gray-700',
                    'text-gray-500 hover:text-gray-300'
                  )}`}
                >
                  <span>{cat.title}</span>
                  <ChevronDown
                    size={10}
                    className={openGroups[cat.key] ? 'rotate-180' : ''}
                    style={{ transition: 'transform 0.15s' }}
                  />
                </button>
                {openGroups[cat.key] && (
                  <div className="pb-2 space-y-0.5">
                    {cat.items.map((item) => (
                      <div
                        key={item.name}
                        ref={(ref) => {
                          if (ref && !item.newPageName) {
                            connectors.create(
                              ref,
                              React.createElement(Element, {
                                is: item.component,
                                canvas: item.canvas,
                              })
                            );
                          }
                        }}
                        onClick={item.newPageName ? () => handleAuthComponentClick(item) : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group select-none ${item.newPageName ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} ${t(
                          'hover:bg-gray-100',
                          'hover:bg-[#1a1a1a]'
                        )}`}
                      >
                        <span className="w-6 h-6 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-orange-400 transition-colors">
                          {(() => {
                            const IconC = Icons[item.name as keyof typeof Icons];
                            return IconC ? <IconC width={16} height={16} className="text-gray-400 group-hover:text-orange-400 transition-colors" /> : <span className="text-lg">{item.icon}</span>;
                          })()}
                        </span>
                        <span className={`text-sm ${t('text-gray-600 group-hover:text-gray-900', 'text-gray-300 group-hover:text-white')}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                  'border-[#2a2a2a] hover:border-[#FF6B35] bg-[#1a1a1a] hover:bg-[#242424]'
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
