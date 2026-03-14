'use client';

import { useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';
import lz from 'lzutf8';
import { useEditorTheme } from './EditorThemeContext';
import { COLOR_PRESETS } from '@/lib/craft/presets/colors';
import { useAuth } from '@/lib/hooks/useAuth';
import { MediaLibrary } from '@/components/craft/MediaLibrary';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const ANIM_PRESETS = [
  { id: 'none', label: 'No animation', icon: '○' },
  { id: 'fade', label: 'Fade in', icon: '◐' },
  { id: 'slide-up', label: 'Slide up', icon: '↑' },
  { id: 'slide-left', label: 'Slide left', icon: '←' },
  { id: 'zoom', label: 'Zoom in', icon: '⊕' },
  { id: 'bounce', label: 'Bounce', icon: '⟳' },
];

const DEVICES: { key: DeviceMode; label: string; width: string }[] = [
  { key: 'desktop', label: 'Desktop', width: '100%' },
  { key: 'tablet', label: '768', width: '768px' },
  { key: 'mobile', label: '375', width: '375px' },
];

const orangeButtonStyle = {
  background: 'rgba(255, 107, 53, 0.15)',
  color: '#FF6B35',
  border: '1px solid rgba(255, 107, 53, 0.3)',
  borderRadius: 6,
  width: 28,
  height: 28,
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  cursor: 'pointer' as const,
  fontSize: 16,
  fontWeight: 600,
};

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

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
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [animPreset, setAnimPreset] = React.useState('none');
  const [showAnimMenu, setShowAnimMenu] = React.useState(false);
  const [accentColor, setAccentColor] = useState('#e11d48');
  const [canvasScheme, setCanvasScheme] = useState<'dark' | 'light'>('dark');

  // Global cursor spotlight (preview mode, controlled by cursor button)
  const [spotlightEnabled, setSpotlightEnabled] = useState(true);
  const [spotlightIntensity, setSpotlightIntensity] = useState(15);
  const [showSpotlightMenu, setShowSpotlightMenu] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState({ x: -9999, y: -9999 });
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const { user } = useAuth();
  const { t } = useEditorTheme();

  const applySchemeToTronNodes = useCallback(
    (scheme: 'dark' | 'light') => {
      try {
        const state = query.getState();
        const nodes = state?.nodes ?? {};
        Object.keys(nodes).forEach((id) => {
          if (id === 'ROOT') return;
          const node = nodes[id];
          const props = node?.data?.props;
          if (props && 'colorScheme' in props) {
            actions.setProp(id, (p: Record<string, unknown>) => {
              p.colorScheme = scheme;
            });
          }
        });
      } catch {
        // noop
      }
    },
    [query, actions]
  );

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

  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Spotlight: track cursor only on canvas (preview mode), hide when cursor leaves
  React.useEffect(() => {
    if (!spotlightEnabled || !previewMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      setSpotlightPos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseLeave = () => {
      setSpotlightPos({ x: -9999, y: -9999 });
    };

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [spotlightEnabled, previewMode]);

  // Spotlight clip: use canvas container top (fixed on screen), not header (changes on scroll)
  React.useEffect(() => {
    if (!previewMode || !spotlightEnabled) return;

    const canvasContainer = canvasRef.current;
    if (canvasContainer) {
      const rect = canvasContainer.getBoundingClientRect();
      setHeaderHeight(rect.top); // top канвы = фиксированная позиция от верха viewport
    } else {
      const header = document.querySelector('[data-block-type="header"]') as HTMLElement;
      setHeaderHeight(header ? header.offsetHeight + 90 : 90); // 90 = высота тулбаров
    }
  }, [previewMode, spotlightEnabled]);

  const spotlightButtonRef = React.useRef<HTMLDivElement>(null);

  // Close spotlight dropdown on click outside
  React.useEffect(() => {
    if (!showSpotlightMenu) return;
    const handler = (e: MouseEvent) => {
      const el = spotlightButtonRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowSpotlightMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSpotlightMenu]);

  const applyColorPreset = useCallback(
    (preset: { id: string; label: string; accent: string; bg: string }) => {
      try {
        const accent = preset.accent;
        const state = query.getState();
        const nodes = state?.nodes ?? {};

        // Get current darkBg/lightBg from first node that has them
        let darkBg = '#0a0a0a';
        let lightBg = '#ffffff';
        Object.keys(nodes).forEach((id) => {
          if (id === 'ROOT') return;
          const props = nodes[id]?.data?.props;
          if (props && 'darkBg' in props && props.darkBg) darkBg = props.darkBg as string;
          if (props && 'lightBg' in props && props.lightBg) lightBg = props.lightBg as string;
        });

        // Update current Frame nodes
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

        // Dispatch event so all other pages get updated too
        window.dispatchEvent(new CustomEvent('iam_color_preset_changed', {
          detail: { accentColor: accent, darkBg, lightBg }
        }));
      } catch {
        // noop
      }
    },
    [query, actions]
  );

  // Map preset ids to component animationType values
  const presetToAnimationType: Record<string, string> = {
    none: 'none',
    fade: 'fade-in',
    'slide-up': 'slide-up',
    'slide-left': 'slide-left',
    zoom: 'scale-in',
    bounce: 'bounce',
  };

  const applyAnimPreset = useCallback(
    (presetId: string) => {
      setAnimPreset(presetId);
      const animationType = presetToAnimationType[presetId] ?? presetId;
      try {
        const nodes = query.getState()?.nodes ?? {};
        Object.keys(nodes).forEach((nodeId) => {
          const node = nodes[nodeId];
          if (node?.data?.props?.animationType !== undefined) {
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              props.animationType = animationType;
            });
          }
        });
      } catch {
        // noop
      }
      setShowAnimMenu(false);
    },
    [query, actions]
  );

  const animMenuRef = React.useRef<HTMLDivElement>(null);

  // Close anim dropdown on click outside
  React.useEffect(() => {
    if (!showAnimMenu) return;
    const handler = (e: MouseEvent) => {
      const el = animMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowAnimMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAnimMenu]);

  return (
    <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${t('bg-[#e2e8f0]', 'bg-[#1f1f1f]')}`}>
      {/* Global spotlight overlay (fixed, preview only, follows cursor on canvas) */}
      {spotlightEnabled && previewMode && spotlightPos.x >= 0 && spotlightPos.y >= 0 && (
        <div
          style={{
            position: 'fixed',
            top: headerHeight,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            background: `radial-gradient(circle 400px at ${spotlightPos.x}px ${spotlightPos.y - headerHeight}px,
              rgba(${hexToRgb(accentColor)}, ${spotlightIntensity / 100}) 0%,
              transparent 70%
            )`,
          }}
        />
      )}

      {showMediaLibrary && user && (
        <MediaLibrary
          userId={user.id}
          accept="all"
          onSelect={() => setShowMediaLibrary(false)}
          onClose={() => setShowMediaLibrary(false)}
        />
      )}

      {/* Secondary toolbar — viewport, accent presets, zoom (editor always dark) */}
      <div
        className="craft-canvas-toolbar flex items-center justify-between gap-3 shrink-0 px-4 h-11 border-b"
      >
        {/* Left: viewport switcher (Desktop / Tablet / Mobile) */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255, 107, 53, 0.08)', border: '1px solid rgba(255, 107, 53, 0.3)' }}
        >
          <button
            type="button"
            onClick={() => switchViewport('desktop')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
            style={{
              background: viewport === 'desktop' ? 'rgba(255, 107, 53, 0.2)' : 'transparent',
              color: '#FF6B35',
              border: 'none',
              cursor: 'pointer',
              fontWeight: viewport === 'desktop' ? 600 : 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="2" width="12" height="8" rx="1" />
              <path d="M5 10v2M9 10v2M4 12h6" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255, 107, 53, 0.25)' }} />
          <button
            type="button"
            onClick={() => switchViewport('tablet')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
            style={{
              background: viewport === 'tablet' ? 'rgba(255, 107, 53, 0.2)' : 'transparent',
              color: '#FF6B35',
              border: 'none',
              cursor: 'pointer',
              fontWeight: viewport === 'tablet' ? 600 : 500,
            }}
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="0.6" y="0.6" width="10.8" height="12.8" rx="1.2" />
              <circle cx="6" cy="12" r="0.6" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">768</span>
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255, 107, 53, 0.25)' }} />
          <button
            type="button"
            onClick={() => switchViewport('mobile')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
            style={{
              background: viewport === 'mobile' ? 'rgba(255, 107, 53, 0.2)' : 'transparent',
              color: '#FF6B35',
              border: 'none',
              cursor: 'pointer',
              fontWeight: viewport === 'mobile' ? 600 : 500,
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

        {/* Canvas color scheme (dark/light) */}
        <button
          type="button"
          onClick={() => {
            const newScheme = canvasScheme === 'dark' ? 'light' : 'dark';
            setCanvasScheme(newScheme);
            applySchemeToTronNodes(newScheme);
          }}
          style={{
            background: canvasScheme === 'dark' ? 'rgba(255,107,53,0.15)' : 'rgba(255,107,53,0.3)',
            color: '#FF6B35',
            border: '1px solid rgba(255,107,53,0.3)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            cursor: 'pointer',
          }}
          title={canvasScheme === 'dark' ? 'Switch canvas to light' : 'Switch canvas to dark'}
        >
          {canvasScheme === 'dark' ? '☀' : '☾'}
        </button>

        {/* Media Library */}
        <button
          type="button"
          title="Media Library"
          onClick={() => setShowMediaLibrary(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            color: '#a1a1aa',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        {/* Spotlight cursor */}
        <div ref={spotlightButtonRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowSpotlightMenu(!showSpotlightMenu)}
            title="Spotlight"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              background: spotlightEnabled ? 'rgba(255,107,53,0.15)' : 'transparent',
              border: spotlightEnabled ? '1px solid rgba(255,107,53,0.4)' : '1px solid transparent',
              cursor: 'pointer',
              color: spotlightEnabled ? '#FF6B35' : '#a1a1aa',
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-2.474 1.234-4.369-8.91-6.531 5.677z" />
            </svg>
          </button>

          {showSpotlightMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 8,
                zIndex: 100,
                background: '#1a1a1a',
                border: '1px solid rgba(255,107,53,0.3)',
                borderRadius: 10,
                padding: 16,
                minWidth: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>Spotlight cursor</span>
                <button
                  type="button"
                  onClick={() => setSpotlightEnabled(!spotlightEnabled)}
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: spotlightEnabled ? '#FF6B35' : '#333',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: spotlightEnabled ? 18 : 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </div>

              <div style={{ opacity: spotlightEnabled ? 1 : 0.4 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 11, color: '#a1a1aa' }}>Intensity</span>
                  <span style={{ fontSize: 11, color: '#FF6B35' }}>{spotlightIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={spotlightIntensity}
                  disabled={!spotlightEnabled}
                  onChange={(e) => setSpotlightIntensity(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: 4,
                    borderRadius: 2,
                    accentColor: '#FF6B35',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Animation preset */}
        <div ref={animMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            title="Animation preset"
            onClick={() => setShowAnimMenu(!showAnimMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              background: animPreset !== 'none' ? 'rgba(255,107,53,0.15)' : 'transparent',
              border: animPreset !== 'none' ? '1px solid rgba(255,107,53,0.4)' : '1px solid transparent',
              cursor: 'pointer',
              color: animPreset !== 'none' ? '#FF6B35' : '#a1a1aa',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </button>

          {showAnimMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 8,
                zIndex: 100,
                background: '#1a1a1a',
                border: '1px solid rgba(255,107,53,0.3)',
                borderRadius: 10,
                padding: 8,
                minWidth: 180,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: '#666',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '4px 8px 8px',
                  letterSpacing: '0.08em',
                }}
              >
                Animation preset
              </div>
              {ANIM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAnimPreset(preset.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: animPreset === preset.id ? 'rgba(255,107,53,0.1)' : 'transparent',
                    color: animPreset === preset.id ? '#FF6B35' : '#d4d4d8',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 14, width: 18 }}>{preset.icon}</span>
                  {preset.label}
                  {animPreset === preset.id && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#FF6B35' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

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
          <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 10))} style={orangeButtonStyle}>
            −
          </button>
          <span style={{ color: '#FF6B35', fontSize: 12, minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(150, z + 10))} style={orangeButtonStyle}>
            +
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
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
