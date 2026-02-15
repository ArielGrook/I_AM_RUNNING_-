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
    title: 'Базовые',
    items: [
      { name: 'Container', component: Container, canvas: true },
      { name: 'Text', component: Text, canvas: false },
      { name: 'Button', component: Button, canvas: false },
      { name: 'Image', component: Image, canvas: false },
    ],
  },
  {
    title: 'Секции',
    items: [
      { name: 'Hero', component: Hero, canvas: true },
      { name: 'CTA', component: CTA, canvas: true },
      { name: 'Features', component: Features, canvas: true },
      { name: 'Footer', component: Footer, canvas: false },
    ],
  },
  {
    title: 'Навигация',
    items: [{ name: 'Header', component: Header, canvas: true }],
  },
];

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto shrink-0">
      <div className="p-4 border-b border-gray-700 font-semibold text-white">
        Components
      </div>
      <div className="p-4 space-y-6">
        {categories.map((cat) => (
          <div key={cat.title}>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              {cat.title}
            </div>
            <div className="space-y-2">
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
                  className="p-3 bg-gray-700 rounded cursor-move hover:bg-gray-600 text-white text-sm"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
