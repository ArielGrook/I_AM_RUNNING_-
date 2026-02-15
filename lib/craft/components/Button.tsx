'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Button = ({
  text = 'Click me',
  bgColor = '#FF6B35',
  textColor = '#ffffff',
  padding = '12px 32px',
  borderRadius = 8,
}: {
  text?: string;
  bgColor?: string;
  textColor?: string;
  padding?: string;
  borderRadius?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <button
      ref={(ref) => ref && connect(drag(ref))}
      type="button"
      style={{
        background: bgColor,
        color: textColor,
        padding,
        borderRadius: `${borderRadius}px`,
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
      }}
    >
      {text}
    </button>
  );
};

const ButtonSettings = () => {
  const {
    actions: { setProp },
    text,
    bgColor,
    textColor,
    borderRadius,
  } = useNode((node) => ({
    text: node.data.props.text as string,
    bgColor: node.data.props.bgColor as string,
    textColor: node.data.props.textColor as string,
    borderRadius: node.data.props.borderRadius as number,
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm mb-2 text-gray-300">Text</label>
        <input
          type="text"
          value={text ?? 'Click me'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.text = e.target.value;
            })
          }
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">Background Color</label>
        <input
          type="color"
          value={bgColor ?? '#FF6B35'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.bgColor = e.target.value;
            })
          }
          className="w-full h-10 rounded bg-gray-700 border border-gray-600"
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">Text Color</label>
        <input
          type="color"
          value={textColor ?? '#ffffff'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.textColor = e.target.value;
            })
          }
          className="w-full h-10 rounded bg-gray-700 border border-gray-600"
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">
          Border Radius: {borderRadius ?? 8}px
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={borderRadius ?? 8}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.borderRadius = Number(e.target.value);
            })
          }
          className="w-full"
        />
      </div>
    </div>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    text: 'Click me',
    bgColor: '#FF6B35',
    textColor: '#ffffff',
    padding: '12px 32px',
    borderRadius: 8,
  },
  related: {
    settings: ButtonSettings,
  },
};
