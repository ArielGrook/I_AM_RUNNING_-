'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Image = ({
  src = 'https://via.placeholder.com/800x400',
  alt = 'Image',
  width = '100%',
  borderRadius = 0,
}: {
  src?: string;
  alt?: string;
  width?: string;
  borderRadius?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ display: 'block', width: width === '100%' ? '100%' : width }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: width === '100%' ? '100%' : width,
          borderRadius: `${borderRadius}px`,
          display: 'block',
        }}
      />
    </div>
  );
};

const ImageSettings = () => {
  const {
    actions: { setProp },
    src,
    alt,
    width,
    borderRadius,
  } = useNode((node) => ({
    src: node.data.props.src as string,
    alt: node.data.props.alt as string,
    width: node.data.props.width as string,
    borderRadius: node.data.props.borderRadius as number,
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm mb-2 text-gray-300">Image URL</label>
        <input
          type="text"
          value={src ?? ''}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.src = e.target.value;
            })
          }
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">Alt Text</label>
        <input
          type="text"
          value={alt ?? ''}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.alt = e.target.value;
            })
          }
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">Width</label>
        <select
          value={width ?? '100%'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.width = e.target.value;
            })
          }
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        >
          <option value="100%">Full Width</option>
          <option value="75%">75%</option>
          <option value="50%">50%</option>
          <option value="33%">33%</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-2 text-gray-300">
          Border Radius: {borderRadius ?? 0}px
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={borderRadius ?? 0}
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

Image.craft = {
  displayName: 'Image',
  props: {
    src: 'https://via.placeholder.com/800x400',
    alt: 'Image',
    width: '100%',
    borderRadius: 0,
  },
  related: {
    settings: ImageSettings,
  },
};
