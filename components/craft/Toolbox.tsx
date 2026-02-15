'use client';

import { Element, useEditor } from '@craftjs/core';
import React from 'react';
import { Container, Text, Hero } from '@/lib/craft/components';

const components = [
  { name: 'Container', component: Container },
  { name: 'Text', component: Text },
  { name: 'Hero', component: Hero },
];

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto shrink-0">
      <div className="p-4 border-b border-gray-700 font-semibold text-white">
        Components
      </div>
      <div className="p-4 space-y-2">
        {components.map((item) => (
          <div
            key={item.name}
            ref={(ref) => {
              if (ref) {
                connectors.create(ref, React.createElement(Element, { is: item.component, canvas: true }));
              }
            }}
            className="p-3 bg-gray-700 rounded cursor-move hover:bg-gray-600 text-white text-sm"
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};
