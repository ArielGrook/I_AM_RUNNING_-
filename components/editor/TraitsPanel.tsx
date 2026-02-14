'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  Image,
  Hash,
  Info,
  ExternalLink,
  Eye,
  Type,
  MousePointer,
  FormInput,
  FileText,
} from 'lucide-react';

interface TraitsPanelProps {
  editor: any;
  className?: string;
  isDark: boolean;
  t?: (key: string) => string;
}

interface TraitDef {
  name: string;
  labelKey: string;
  type: 'text' | 'select';
  options?: string[];
  placeholder: string;
  icon: React.ElementType;
}

const ALL_TRAITS: TraitDef[] = [
  { name: 'id', labelKey: 'traits.id', type: 'text', placeholder: 'my-element', icon: Hash },
  { name: 'title', labelKey: 'traits.titleAttr', type: 'text', placeholder: 'Tooltip text on hover', icon: Info },
  { name: 'href', labelKey: 'traits.href', type: 'text', placeholder: 'https://example.com', icon: Link2 },
  { name: 'target', labelKey: 'traits.target', type: 'select', options: ['_self', '_blank', '_parent', '_top'], placeholder: '', icon: ExternalLink },
  { name: 'alt', labelKey: 'traits.alt', type: 'text', placeholder: 'Describe image for accessibility', icon: Eye },
  { name: 'src', labelKey: 'traits.src', type: 'text', placeholder: 'https://example.com/image.jpg', icon: Image },
  { name: 'placeholder', labelKey: 'traits.placeholder', type: 'text', placeholder: 'Enter placeholder text...', icon: Type },
];

interface TagConfig {
  descriptionKey: string;
  icon: React.ElementType;
  traits: string[];
}

const TAG_CONFIG: Record<string, TagConfig> = {
  a:        { descriptionKey: 'traits.descLink', icon: Link2, traits: ['href', 'target', 'title', 'id'] },
  img:      { descriptionKey: 'traits.descImage', icon: Image, traits: ['src', 'alt', 'title', 'id'] },
  input:    { descriptionKey: 'traits.descInput', icon: FormInput, traits: ['placeholder', 'title', 'id'] },
  textarea: { descriptionKey: 'traits.descInput', icon: FormInput, traits: ['placeholder', 'title', 'id'] },
  button:   { descriptionKey: 'traits.descButton', icon: MousePointer, traits: ['title', 'id'] },
  iframe:   { descriptionKey: 'traits.descIframe', icon: FileText, traits: ['src', 'title', 'id'] },
};

const DEFAULT_CONFIG: TagConfig = {
  descriptionKey: 'traits.descGeneric',
  icon: FileText,
  traits: ['id', 'title'],
};

const FALLBACK: Record<string, string> = {
  'traits.heading': 'Element Properties',
  'traits.noTraits': 'Select an element to edit its properties',
  'traits.noTraitsHint': 'Click any element on the canvas',
  'traits.id': 'ID',
  'traits.titleAttr': 'Title',
  'traits.href': 'Link URL',
  'traits.target': 'Open In',
  'traits.alt': 'Alt Text',
  'traits.src': 'Source URL',
  'traits.placeholder': 'Placeholder',
  'traits.descLink': 'Edit link destination and behavior',
  'traits.descImage': 'Edit image source and accessibility text',
  'traits.descInput': 'Edit input field properties',
  'traits.descButton': 'Edit button properties',
  'traits.descIframe': 'Edit embedded content source',
  'traits.descGeneric': 'Edit element attributes',
};

export function TraitsPanel({ editor, className = '', isDark, t: tProp }: TraitsPanelProps) {
  const t = tProp || ((key: string) => FALLBACK[key] || key.split('.').pop() || key);

  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [traitValues, setTraitValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editor) return;
    const handleSelect = () => {
      const sel = editor.getSelected?.();
      setSelectedComponent(sel);
      if (sel) {
        setTraitValues({ ...(sel.getAttributes?.() || {}) });
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

  const tagName = (selectedComponent?.get?.('tagName') || '').toLowerCase();
  const config = TAG_CONFIG[tagName] || DEFAULT_CONFIG;
  const TagIcon = config.icon;
  const relevantTraits = ALL_TRAITS.filter(td => config.traits.includes(td.name));

  return (
    <div className={`overflow-y-auto ${className}`}>
      {!selectedComponent ? (
        <div className="px-4 py-6 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gray-100 dark:bg-[#3a3a3a] flex items-center justify-center">
            <MousePointer className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('traits.noTraits')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('traits.noTraitsHint')}</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-200 dark:border-[#4a4a4a]">
            <div className="w-7 h-7 rounded-md bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
              <TagIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold text-gray-800 dark:text-white bg-gray-100 dark:bg-[#3a3a3a] px-1.5 py-0.5 rounded">
                  {tagName || 'div'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                {t(config.descriptionKey)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {relevantTraits.map(trait => {
              const TraitIcon = trait.icon;
              return (
                <div key={trait.name} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <TraitIcon className="w-3.5 h-3.5 text-[#FF6B35]/70" />
                    {t(trait.labelKey)}
                  </label>
                  {trait.type === 'select' ? (
                    <select
                      value={traitValues[trait.name] || '_self'}
                      onChange={(e) => updateTrait(trait.name, e.target.value)}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 dark:border-[#4a4a4a] rounded-md bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                    >
                      {trait.options?.map(opt => (
                        <option key={opt} value={opt}>
                          {opt === '_self' ? 'Same tab' : opt === '_blank' ? 'New tab' : opt === '_parent' ? 'Parent frame' : 'Top frame'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={traitValues[trait.name] || ''}
                      onChange={(e) => updateTrait(trait.name, e.target.value)}
                      placeholder={trait.placeholder}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 dark:border-[#4a4a4a] rounded-md bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
