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

  return (
    <div className="w-60 bg-[#1e1e1e] border-r border-gray-700/60 overflow-y-auto shrink-0 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700/60 shrink-0">
        <span className="text-sm font-semibold text-white tracking-wide">Components</span>
      </div>
      <div className="p-3 space-y-5 flex-1">
        {categories.map((cat) => (
          <div key={cat.title}>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">
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
                  className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg cursor-grab
                    bg-gray-800/60 border border-gray-700/40
                    hover:bg-[#FF6B35]/10 hover:border-[#FF6B35]/40 hover:text-[#FF6B35]
                    active:scale-95 transition-all duration-150 text-gray-300 select-none"
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
