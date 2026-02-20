'use client';

import { useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';
import lz from 'lzutf8';
import { useEditorTheme } from './EditorThemeContext';
import { COLOR_PRESETS } from '@/lib/craft/presets/colors';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { key: DeviceMode; label: string; width: string }[] = [
  { key: 'desktop', label: 'Desktop', width: '100%' },
  { key: 'tablet', label: '768', width: '768px' },
  { key: 'mobile', label: '375', width: '375px' },
];

type ViewportProps = {
  children: React.ReactNode;
  viewport: DeviceMode;
  setViewport: (v: DeviceMode) => void;
  desktopData: string | null;
  setDesktopData: (v: string | null) => void;
  mobileData: string | null;
  setMobileData: (v: string | null) => void;
};

export const Viewport = ({
  children,
  viewport,
  setViewport,
  desktopData,
  setDesktopData,
  mobileData,
  setMobileData,
}: ViewportProps) => {
  const { connectors, isDragging, actions, query } = useEditor((state) => ({
    isDragging: state.events.dragged.size > 0,
  }));
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const { t } = useEditorTheme();

  const switchViewport = useCallback(
    (newViewport: DeviceMode) => {
      if (newViewport === viewport) return;
      const currentSerialized = query.serialize();
      const currentCompressed = lz.compress(currentSerialized, { outputEncoding: 'Base64' });
      if (viewport === 'desktop') {
        setDesktopData(currentCompressed);
      } else {
        setMobileData(currentCompressed);
      }
      if (newViewport === 'desktop') {
        if (desktopData) {
          const json = lz.decompress(desktopData, { inputEncoding: 'Base64' }) as string;
          actions.deserialize(json);
        }
      } else {
        if (mobileData) {
          const json = lz.decompress(mobileData, { inputEncoding: 'Base64' }) as string;
          actions.deserialize(json);
        } else if (desktopData) {
          const json = lz.decompress(desktopData, { inputEncoding: 'Base64' }) as string;
          actions.deserialize(json);
          setMobileData(desktopData);
        }
      }
      setViewport(newViewport);
    },
    [viewport, desktopData, mobileData, query, actions, setViewport, setDesktopData, setMobileData]
  );

  const activeDevice = DEVICES.find((d) => d.key === viewport)!;

  const applyColorPreset = useCallback(
    (preset: { id: string; label: string; bg: string }) => {
      try {
        const serialized = query.getSerializedNodes();
        Object.keys(serialized).forEach((id) => {
          if (id === 'ROOT') return;
          actions.setProp(id, (props: Record<string, unknown>) => {
            props.accentColor = preset.bg;
          });
        });
        setActivePresetId(preset.id);
      } catch {
        // noop
      }
    },
    [query, actions]
  );

  return (
    <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${t('bg-[#e2e8f0]', 'bg-[#1f1f1f]')}`}>
      {/* Secondary toolbar — viewport, accent presets, zoom (editor always dark) */}
      <div
        className="flex items-center justify-between gap-3 shrink-0 px-4 h-11 bg-[#1a1a1a] border-b border-[#2a2a2a]"
      >
        {/* Left: viewport switcher pill */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ background: '#111111', border: '1px solid #2a2a2a' }}
        >
          <button
            type="button"
            onClick={() => switchViewport('desktop')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
            style={{
              background: viewport === 'desktop' ? '#2a2a2a' : 'transparent',
              color: viewport === 'desktop' ? '#ffffff' : '#71717a',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="2" width="12" height="8" rx="1" />
              <path d="M5 10v2M9 10v2M4 12h6" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <div style={{ width: 1, height: 20, background: '#2a2a2a' }} />
          <button
            type="button"
            onClick={() => switchViewport('tablet')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
            style={{
              background: viewport === 'tablet' ? '#2a2a2a' : 'transparent',
              color: viewport === 'tablet' ? '#ffffff' : '#71717a',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="0.6" y="0.6" width="10.8" height="12.8" rx="1.2" />
              <circle cx="6" cy="12" r="0.6" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">768</span>
          </button>
          <div style={{ width: 1, height: 20, background: '#2a2a2a' }} />
          <button
            type="button"
            onClick={() => switchViewport('mobile')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
            style={{
              background: viewport === 'mobile' ? '#2a2a2a' : 'transparent',
              color: viewport === 'mobile' ? '#ffffff' : '#71717a',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="0.6" y="0.6" width="7.8" height="12.8" rx="1.4" />
              <circle cx="4.5" cy="12" r="0.6" fill="currentColor" />
              <path d="M3 2h3" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">375</span>
          </button>
        </div>

        {/* Center: color presets */}
        <div
          className="flex items-center gap-1.5 px-3"
          style={{ borderLeft: '1px solid #2a2a2a', borderRight: '1px solid #2a2a2a' }}
        >
          <span className="text-xs text-[#52525b] mr-1">Accent</span>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyColorPreset(preset)}
              title={preset.label}
              className="rounded-full transition-all duration-150 hover:scale-110 flex-shrink-0"
              style={{
                width: activePresetId === preset.id ? 18 : 14,
                height: activePresetId === preset.id ? 18 : 14,
                background: preset.bg,
                outline: activePresetId === preset.id ? `2px solid ${preset.bg}` : '2px solid transparent',
                outlineOffset: 2,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Right: zoom */}
        <div
          className="flex items-center gap-1 rounded-lg"
          style={{ background: '#111111', border: '1px solid #2a2a2a' }}
        >
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="px-2 py-1.5 text-sm text-[#71717a] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          >
            −
          </button>
          <span className="text-xs text-[#a1a1aa] min-w-[36px] text-center">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="px-2 py-1.5 text-sm text-[#71717a] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 overflow-auto craft-viewport-scroll craft-canvas-wrapper"
        style={{
          background: t('#e2e8f0', '#1f1f1f'),
          backgroundImage: t(
            'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            'radial-gradient(circle, #2a2a2a 1px, transparent 1px)'
          ),
          backgroundSize: '20px 20px',
        }}
      >
        <div className="p-6 min-h-full flex justify-center">
          <div
            className="transition-all duration-300"
            data-viewport={viewport}
            style={{
              width: activeDevice.width,
              maxWidth: '100%',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={(ref) => { if (ref) connectors.select(ref, ''); }}
              className={`min-h-screen bg-white transition-all duration-200 relative ${
                isDragging
                  ? 'ring-2 ring-[#FF6B35]/60 ring-offset-2 ring-offset-transparent shadow-[0_0_50px_rgba(255,107,53,0.2)]'
                  : t('shadow-[0_0_40px_rgba(0,0,0,0.1)]', 'shadow-[0_0_60px_rgba(0,0,0,0.4)]')
              }`}
              style={{ borderRadius: viewport !== 'desktop' ? 12 : 0 }}
            >
              {/* Alignment grid overlay */}
              {showGrid && (
                <div
                  className="craft-grid-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 9998,
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,107,53,0.07) 1px, transparent 1px),' +
                      'linear-gradient(to bottom, rgba(255,107,53,0.07) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                >
                  {/* Center line vertical */}
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'rgba(255,107,53,0.2)',
                  }} />
                  {/* 12-column guides */}
                  {[...Array(11)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${((i + 1) / 12) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: 'rgba(255,255,255,0.06)',
                    }} />
                  ))}
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
