'use client';

import { Element, useEditor } from '@craftjs/core';
import React from 'react';
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
} from '@/lib/craft/components';
import { useEditorTheme } from './EditorThemeContext';

const categories = [
  {
    title: 'Basic',
    items: [
      { name: 'Container', icon: '▦', component: Container, canvas: true },
      { name: 'Text',      icon: 'T',  component: Text,      canvas: false },
      { name: 'Button',    icon: '▣', component: Button,    canvas: false },
      { name: 'Image',     icon: '🖼', component: Image,     canvas: false },
    ],
  },
  {
    title: 'Sections',
    items: [
      { name: 'Hero',     icon: '◉', component: Hero,     canvas: false },
      { name: 'CTA',      icon: '▶', component: CTA,      canvas: false },
      { name: 'Features', icon: '✦', component: Features, canvas: false },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { name: 'Header', icon: '☰', component: Header, canvas: false },
      { name: 'Footer', icon: '▬', component: Footer, canvas: false },
    ],
  },
];

export const Toolbox = () => {
  const { connectors } = useEditor();
  const { t } = useEditorTheme();

  return (
    <div className={`w-60 border-r overflow-y-auto shrink-0 flex flex-col ${t(
      'bg-white border-gray-200',
      'bg-[#1e1e1e] border-gray-700/60'
    )}`}>
      <div className={`px-4 py-3 border-b shrink-0 ${t('border-gray-200', 'border-gray-700/60')}`}>
        <span className={`text-sm font-semibold tracking-wide ${t('text-gray-900', 'text-white')}`}>Components</span>
      </div>
      <div className="p-3 space-y-5 flex-1">
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
    </div>
  );
};
