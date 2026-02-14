'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';

interface TraitsPanelProps {
  editor: any;
  className?: string;
  isDark: boolean;
  t?: (key: string) => string;
}

interface TraitDef {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: string[];
  placeholder?: string;
}

const COMMON_TRAITS: TraitDef[] = [
  { name: 'id', label: 'traits.id', type: 'text', placeholder: 'element-id' },
  { name: 'title', label: 'traits.title', type: 'text', placeholder: 'Title text' },
  { name: 'href', label: 'traits.href', type: 'text', placeholder: 'https://...' },
  { name: 'target', label: 'traits.target', type: 'select', options: ['_self', '_blank', '_parent', '_top'] },
  { name: 'alt', label: 'traits.alt', type: 'text', placeholder: 'Image description' },
  { name: 'src', label: 'traits.src', type: 'text', placeholder: 'https://...' },
  { name: 'placeholder', label: 'traits.placeholder', type: 'text', placeholder: 'Placeholder text' },
];

function getRelevantTraits(tagName: string): string[] {
  const tag = (tagName || '').toLowerCase();
  const base = ['id', 'title'];
  if (tag === 'a') return [...base, 'href', 'target'];
  if (tag === 'img') return [...base, 'src', 'alt'];
  if (tag === 'input' || tag === 'textarea') return [...base, 'placeholder'];
  if (tag === 'iframe') return [...base, 'src'];
  if (tag === 'button') return base;
  return base;
}

export function TraitsPanel({ editor, className = '', isDark, t: tProp }: TraitsPanelProps) {
  const t = tProp || ((key: string) => {
    const fallback: Record<string, string> = {
      'traits.title': 'Attributes', 'traits.noTraits': 'Select an element to edit its attributes',
      'traits.id': 'ID', 'traits.href': 'Link URL', 'traits.target': 'Target',
      'traits.alt': 'Alt Text', 'traits.src': 'Source URL',
      'traits.placeholder': 'Placeholder',
    };
    return fallback[key] || key.split('.').pop() || key;
  });

  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [traitValues, setTraitValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editor) return;

    const handleSelect = () => {
      const selected = editor.getSelected?.();
      setSelectedComponent(selected);
      if (selected) {
        const attrs = selected.getAttributes?.() || {};
        setTraitValues({ ...attrs });
      } else {
        setTraitValues({});
      }
    };

    const handleDeselect = () => {
      setSelectedComponent(null);
      setTraitValues({});
    };

    editor.on('component:selected', handleSelect);
    editor.on('component:deselected', handleDeselect);

    return () => {
      editor.off('component:selected', handleSelect);
      editor.off('component:deselected', handleDeselect);
    };
  }, [editor]);

  const updateTrait = useCallback((name: string, value: string) => {
    if (!selectedComponent) return;
    if (value) {
      selectedComponent.addAttributes({ [name]: value });
    } else {
      selectedComponent.removeAttributes([name]);
    }
    setTraitValues(prev => ({ ...prev, [name]: value }));
  }, [selectedComponent]);

  const tagName = selectedComponent?.get?.('tagName') || '';
  const relevantTraitNames = getRelevantTraits(tagName);
  const relevantTraits = COMMON_TRAITS.filter(t => relevantTraitNames.includes(t.name));

  const bg = isDark ? '#2d2d2d' : '#f5f5f5';
  const textColor = isDark ? '#e5e5e5' : '#1a1a1a';

  return (
    <div className={`overflow-y-auto ${className}`} style={{ backgroundColor: bg, color: textColor }}>
      {!selectedComponent ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
          <p className="text-sm">{t('traits.noTraits')}</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-[#4a4a4a]">
            <span className="font-mono bg-gray-100 dark:bg-[#3a3a3a] px-2 py-0.5 rounded">&lt;{tagName || 'div'}&gt;</span>
          </div>
          {relevantTraits.map(trait => (
            <div key={trait.name} className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-[#e5e5e5]">
                {t(trait.label)}
              </label>
              {trait.type === 'select' ? (
                <select
                  value={traitValues[trait.name] || ''}
                  onChange={(e) => updateTrait(trait.name, e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-[#4a4a4a] rounded bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
                >
                  {trait.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={traitValues[trait.name] || ''}
                  onChange={(e) => updateTrait(trait.name, e.target.value)}
                  placeholder={trait.placeholder}
                  className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-[#4a4a4a] rounded bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] placeholder:text-gray-400"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
