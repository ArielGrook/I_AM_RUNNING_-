'use client';

import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const DEVICE_ICONS: Record<DeviceMode, string> = {
  desktop: '🖥',
  tablet: '📱',
  mobile: '📲',
};

export const Viewport = ({ children }: { children: React.ReactNode }) => {
  const { connectors, isDragging } = useEditor((state) => ({
    isDragging: state.events.dragged.size > 0,
  }));
  const [device, setDevice] = useState<DeviceMode>('desktop');

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#1a1a1a] overflow-hidden">
      <div className="flex items-center justify-center gap-1 py-2 border-b border-gray-700 shrink-0">
        {(Object.keys(DEVICE_WIDTHS) as DeviceMode[]).map((d) => (
          <button
            key={d}
            onClick={() => setDevice(d)}
            title={d}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              device === d
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
            }`}
          >
            {DEVICE_ICONS[d]}
          </button>
        ))}
        <span className="ml-2 text-xs text-gray-500">
          {device === 'desktop' ? 'Desktop' : device === 'tablet' ? '768px' : '375px'}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div
          className="mx-auto transition-all duration-300"
          style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%' }}
        >
          <div
            ref={(ref) => {
              if (ref) connectors.select(ref, '');
            }}
            className={`min-h-screen bg-white shadow-2xl transition-all duration-150 ${
              isDragging ? 'ring-2 ring-[#FF6B35] ring-opacity-50' : ''
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
