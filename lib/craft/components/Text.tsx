'use client';

import { useNode } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';
import React from 'react';

export const Text = ({
  text = 'Click to edit',
  fontSize = 16,
  textAlign = 'left',
  color = '#000000',
}: {
  text?: string;
  fontSize?: number;
  textAlign?: string;
  color?: string;
}) => {
  const {
    connectors: { connect, drag },
    actions: { setProp },
  } = useNode();

  return (
    <div ref={(ref) => ref && connect(drag(ref))}>
      <ContentEditable
        html={text ?? 'Click to edit'}
        onChange={(e) =>
          setProp((props: Record<string, unknown>) => {
            props.text = (e.target as { value: string }).value.replace(
              /<\/?[^>]+(>|$)/g,
              ''
            );
          })
        }
        tagName="p"
        style={{
          fontSize: `${fontSize ?? 16}px`,
          textAlign: (textAlign as React.CSSProperties['textAlign']) ?? 'left',
          color: color ?? '#000000',
          outline: 'none',
        }}
      />
    </div>
  );
};

const TextSettings = () => {
  const {
    actions: { setProp },
    fontSize,
    textAlign,
    color,
  } = useNode((node) => ({
    fontSize: node.data.props.fontSize as number,
    textAlign: node.data.props.textAlign as string,
    color: node.data.props.color as string,
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm mb-2 text-gray-300">Font Size: {fontSize ?? 16}px</label>
        <input
          type="range"
          min="12"
          max="72"
          value={fontSize ?? 16}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.fontSize = Number(e.target.value);
            })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">Text Align</label>
        <select
          value={textAlign ?? 'left'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.textAlign = e.target.value;
            })
          }
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">Color</label>
        <input
          type="color"
          value={color ?? '#000000'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.color = e.target.value;
            })
          }
          className="w-full h-10 rounded bg-gray-700 border border-gray-600"
        />
      </div>
    </div>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Click to edit',
    fontSize: 16,
    textAlign: 'left',
    color: '#000000',
  },
  related: {
    settings: TextSettings,
  },
};
