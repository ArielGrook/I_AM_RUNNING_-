'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Container = ({
  children,
  background = '#ffffff',
  padding = 20,
}: {
  children?: React.ReactNode;
  background?: string;
  padding?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        background,
        padding: `${padding}px`,
        minHeight: '100px',
      }}
    >
      {children}
    </div>
  );
};

const ContainerSettings = () => {
  const {
    actions: { setProp },
    background,
    padding,
  } = useNode((node) => ({
    background: node.data.props.background as string,
    padding: node.data.props.padding as number,
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm mb-2 text-gray-300">Background Color</label>
        <input
          type="color"
          value={background ?? '#ffffff'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.background = e.target.value;
            })
          }
          className="w-full h-10 rounded bg-gray-700 border border-gray-600"
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">Padding: {padding ?? 20}px</label>
        <input
          type="range"
          min="0"
          max="100"
          value={padding ?? 20}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.padding = Number(e.target.value);
            })
          }
          className="w-full"
        />
      </div>
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    background: '#ffffff',
    padding: 20,
  },
  related: {
    settings: ContainerSettings,
  },
};
