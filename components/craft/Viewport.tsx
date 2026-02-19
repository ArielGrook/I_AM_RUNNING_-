'use client';

import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import { useEditorTheme } from './EditorThemeContext';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { key: DeviceMode; icon: string; label: string; width: string }[] = [
  { key: 'desktop', icon: '🖥', label: 'Desktop', width: '100%' },
  { key: 'tablet',  icon: '📱', label: '768px',   width: '768px' },
  { key: 'mobile',  icon: '📲', label: '375px',   width: '375px' },
];

const ZOOM_LEVELS = [50, 75, 100, 125, 150];

export const Viewport = ({ children }: { children: React.ReactNode }) => {
  const { connectors, isDragging } = useEditor((state) => ({
    isDragging: state.events.dragged.size > 0,
  }));
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [zoom, setZoom] = useState(100);
  const { t } = useEditorTheme();

  const activeDevice = DEVICES.find((d) => d.key === device)!;

  return (
    <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${t('bg-gray-100', 'bg-[#141414]')}`}>
      {/* Toolbar strip */}
      <div className={`flex items-center justify-between px-4 py-1.5 border-b shrink-0 ${t(
        'bg-gray-50 border-gray-200',
        'bg-[#1a1a1a] border-gray-700/60'
      )}`}>
        {/* Device toggle */}
        <div className="flex items-center gap-1">
          {DEVICES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDevice(d.key)}
              title={d.label}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                device === d.key
                  ? 'bg-[#FF6B35] text-white shadow-sm shadow-[#FF6B35]/30'
                  : t('text-gray-500 hover:text-gray-700 hover:bg-gray-200/60', 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/60')
              }`}
            >
              {d.icon}
            </button>
          ))}
          <span className={`ml-2 text-[10px] font-mono ${t('text-gray-400', 'text-gray-600')}`}>{activeDevice.label}</span>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className={`w-6 h-6 flex items-center justify-center rounded text-xs ${t(
              'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60',
              'text-gray-500 hover:text-white hover:bg-gray-700/60'
            )}`}
          >−</button>
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={`bg-transparent text-[10px] font-mono border-0 outline-none cursor-pointer text-center ${t('text-gray-500', 'text-gray-400')}`}
          >
            {ZOOM_LEVELS.map((z) => (
              <option key={z} value={z} className={t('bg-white', 'bg-gray-800')}>{z}%</option>
            ))}
          </select>
          <button
            onClick={() => setZoom((z) => Math.min(150, z + 25))}
            className={`w-6 h-6 flex items-center justify-center rounded text-xs ${t(
              'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60',
              'text-gray-500 hover:text-white hover:bg-gray-700/60'
            )}`}
          >+</button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 overflow-auto craft-viewport-scroll"
        style={{
          backgroundImage: t(
            'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
            'radial-gradient(circle, #2a2a2a 1px, transparent 1px)'
          ),
          backgroundSize: '20px 20px',
        }}
      >
        <div className="p-6 min-h-full flex justify-center">
          <div
            className="transition-all duration-300"
            style={{
              width: activeDevice.width,
              maxWidth: '100%',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={(ref) => { if (ref) connectors.select(ref, ''); }}
              className={`min-h-screen bg-white transition-shadow duration-150 ${
                isDragging
                  ? 'ring-2 ring-[#FF6B35]/50 shadow-[0_0_40px_rgba(255,107,53,0.15)]'
                  : t('shadow-[0_0_40px_rgba(0,0,0,0.12)]', 'shadow-[0_0_60px_rgba(0,0,0,0.4)]')
              }`}
              style={{ borderRadius: device !== 'desktop' ? 8 : 0 }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
