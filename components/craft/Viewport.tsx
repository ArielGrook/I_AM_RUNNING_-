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

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

type ViewportProps = {
  children: React.ReactNode;
  viewport: DeviceMode;
  setViewport: (v: DeviceMode) => void;
  desktopData: string | null;
  setDesktopData: (v: string | null) => void;
  mobileData: string | null;
  setMobileData: (v: string | null) => void;
  previewMode?: boolean;
};

export const Viewport = ({
  children,
  viewport,
  setViewport,
  desktopData,
  setDesktopData,
  mobileData,
  setMobileData,
  previewMode = false,
}: ViewportProps) => {
  const { connectors, isDragging, actions, query } = useEditor((state) => ({
    isDragging: state.events.dragged.size > 0,
  }));
  const { spotlightIntensity } = useEditor((state) => {
    let intensity = 0.12;
    const nodes = state.nodes || {};
    for (const id of Object.keys(nodes)) {
      if (id === 'ROOT') continue;
      const node = nodes[id];
      const v = node?.data?.props?.spotlightIntensity;
      if (v != null && typeof v === 'number') {
        intensity = v;
        break;
      }
    }
    return { spotlightIntensity: intensity };
  });
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#e11d48');
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, visible: false });
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
        if (!mobileData) {
          const desktopJson = lz.decompress(desktopData || currentCompressed, {
            inputEncoding: 'Base64',
          }) as string;
          actions.deserialize(desktopJson);
          setMobileData(desktopData || currentCompressed);
        } else {
          const json = lz.decompress(mobileData, { inputEncoding: 'Base64' }) as string;
          actions.deserialize(json);
        }
      }
      setViewport(newViewport);
    },
    [viewport, desktopData, mobileData, query, actions, setViewport, setDesktopData, setMobileData]
  );

  const activeDevice = DEVICES.find((d) => d.key === viewport)!;

  const applyColorPreset = useCallback(
    (preset: { id: string; label: string; accent: string; bg: string }) => {
      try {
        const accent = preset.accent;
        const state = query.getState();
        const nodes = state?.nodes ?? {};
        Object.keys(nodes).forEach((id) => {
          if (id === 'ROOT') return;
          const node = nodes[id];
          const props = node?.data?.props;
          if (props && 'accentColor' in props) {
            actions.setProp(id, (p: Record<string, unknown>) => {
              p.accentColor = accent;
            });
          }
        });
        setActivePresetId(preset.id);
        setAccentColor(accent);
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
        className="craft-canvas-toolbar flex items-center justify-between gap-3 shrink-0 px-4 h-11 border-b"
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

        {/* Copy Desktop → Mobile (only when not desktop) */}
        {viewport !== 'desktop' && (
          <button
            type="button"
            onClick={() => {
              if (!desktopData) return;
              const json = lz.decompress(desktopData, { inputEncoding: 'Base64' }) as string;
              actions.deserialize(json);
              setMobileData(desktopData);
            }}
            style={{
              background: 'rgba(255, 107, 53, 0.15)',
              color: '#FF6B35',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Скопировать Desktop на Mobile"
          >
            Copy to Mobile
          </button>
        )}

        {/* Center: color presets */}
        <div
          className="flex items-center gap-1.5 px-3"
          style={{ borderLeft: '1px solid #2a2a2a', borderRight: '1px solid #2a2a2a' }}
        >
          <span className="text-xs text-[#52525b] mr-1">Accent</span>
          {COLOR_PRESETS.map((preset) => (
            <div
              key={preset.id}
              role="button"
              tabIndex={0}
              onClick={() => applyColorPreset(preset)}
              onKeyDown={(e) => e.key === 'Enter' && applyColorPreset(preset)}
              title={preset.label}
              style={{
                background: preset.bg,
                width: activePresetId === preset.id ? 20 : 15,
                height: activePresetId === preset.id ? 20 : 15,
                borderRadius: '50%',
                outline: activePresetId === preset.id ? `2px solid ${preset.accent}` : 'none',
                outlineOffset: 2,
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            />
          ))}
        </div>

        {/* Right: zoom */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            style={{
              background: 'rgba(255, 107, 53, 0.15)',
              color: '#FF6B35',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              borderRadius: 6,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            −
          </button>
          <span style={{ color: '#FF6B35', fontSize: 12, minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            style={{
              background: 'rgba(255, 107, 53, 0.15)',
              color: '#FF6B35',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              borderRadius: 6,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 overflow-y-auto craft-viewport-scroll craft-canvas-wrapper"
        style={{
          background: t('#e2e8f0', '#1f1f1f'),
          backgroundImage: t(
            'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            'radial-gradient(circle, #2a2a2a 1px, transparent 1px)'
          ),
          backgroundSize: '20px 20px',
        }}
      >
        <div
          className={`min-h-full flex justify-center ${viewport === 'desktop' ? 'p-6' : 'p-0'}`}
          style={{ margin: 0 }}
        >
          <div
            className="transition-all duration-300"
            data-viewport={viewport}
            style={{
              width: activeDevice.width,
              maxWidth: '100%',
              margin: 0,
              padding: 0,
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
              onMouseMove={(e) => {
                if (previewMode) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setSpotlight({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    visible: true,
                  });
                }
              }}
              onMouseLeave={() => previewMode && setSpotlight((s) => ({ ...s, visible: false }))}
            >
              {/* Global cursor spotlight (preview only) */}
              {previewMode && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 10,
                    transition: 'opacity 300ms ease',
                    opacity: spotlight.visible ? 1 : 0,
                    background: spotlight.visible
                      ? `radial-gradient(600px at ${spotlight.x}px ${spotlight.y}px, rgba(${hexToRgb(accentColor)},${spotlightIntensity}) 0%, transparent 60%)`
                      : 'none',
                  }}
                />
              )}
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
