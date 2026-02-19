'use client';

import { useEditor, useNode, NodeProvider } from '@craftjs/core';
import React, { useState } from 'react';
import { useEditorTheme } from './EditorThemeContext';

// ── Accordion section ──────────────────────────────────
export function SettingsSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useEditorTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border-b last:border-0 ${t('border-gray-200', 'border-gray-700/60')}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${t(
          'hover:bg-gray-100',
          'hover:bg-gray-700/40'
        )}`}
      >
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${t('text-gray-500', 'text-gray-400')}`}>
          {title}
        </span>
        <span className={`text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''} ${t('text-gray-400', 'text-gray-500')}`}>
          ▾
        </span>
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

// ── Delete button (inner — needs useNode context) ──────
function DeleteNodeButton() {
  const { actions } = useEditor();
  const { id } = useNode();
  return (
    <button
      onClick={() => actions.delete(id)}
      title="Delete component"
      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors text-sm"
    >
      ✕
    </button>
  );
}

// ── Style Manager (manual CSS overrides) ───────────────
function StyleManagerInner() {
  const { t } = useEditorTheme();
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({ props: node.data.props as Record<string, unknown> }));

  const inputCls = `w-full px-2 py-1.5 text-xs rounded border transition-colors ${t(
    'bg-gray-50 border-gray-200 text-gray-800 focus:border-[#FF6B35]',
    'bg-gray-800 border-gray-600 text-white focus:border-[#FF6B35]'
  )} outline-none`;
  const labelCls = `block text-[10px] mb-1 uppercase tracking-wide font-semibold ${t('text-gray-400', 'text-gray-500')}`;

  const setVal = (key: string, val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, 300);

  return (
    <div className="p-3 space-y-4">
      {/* Spacing */}
      <section>
        <h3 className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${t('text-gray-500', 'text-gray-400')}`}>Spacing</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Padding</label>
            <input type="number" min={0} max={200} value={Number(props.padding ?? 0)}
              onChange={(e) => setVal('padding', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Margin</label>
            <input type="number" min={0} max={200} value={Number(props.margin ?? 0)}
              onChange={(e) => setVal('margin', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Gap</label>
            <input type="number" min={0} max={100} value={Number(props.gap ?? 0)}
              onChange={(e) => setVal('gap', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Min Height</label>
            <input type="number" min={0} max={2000} value={Number(props.minHeight ?? 0)}
              onChange={(e) => setVal('minHeight', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Colors */}
      <section>
        <h3 className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${t('text-gray-500', 'text-gray-400')}`}>Colors</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className={`${labelCls} mb-0 shrink-0 w-16`}>BG</label>
            <input type="color"
              value={String(props.background ?? props.bgColor ?? '#ffffff').startsWith('var') ? '#ffffff' : String(props.background ?? props.bgColor ?? '#ffffff')}
              onChange={(e) => setVal(props.background !== undefined ? 'background' : 'bgColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0" />
            <span className={`text-[10px] font-mono truncate ${t('text-gray-400', 'text-gray-500')}`}>
              {String(props.background ?? props.bgColor ?? '—')}
            </span>
          </div>
          {props.color !== undefined && (
            <div className="flex items-center gap-2">
              <label className={`${labelCls} mb-0 shrink-0 w-16`}>Text</label>
              <input type="color"
                value={String(props.color ?? '#000000').startsWith('var') ? '#000000' : String(props.color ?? '#000000')}
                onChange={(e) => setVal('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0" />
              <span className={`text-[10px] font-mono truncate ${t('text-gray-400', 'text-gray-500')}`}>
                {String(props.color ?? '—')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Border */}
      <section>
        <h3 className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${t('text-gray-500', 'text-gray-400')}`}>Border</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Radius</label>
            <input type="number" min={0} max={100} value={Number(props.borderRadius ?? 0)}
              onChange={(e) => setVal('borderRadius', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Width</label>
            <input type="number" min={0} max={20} value={Number(props.borderWidth ?? 0)}
              onChange={(e) => setVal('borderWidth', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Typography (if applicable) */}
      {props.fontSize !== undefined && (
        <section>
          <h3 className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${t('text-gray-500', 'text-gray-400')}`}>Typography</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Size (px)</label>
              <input type="number" min={8} max={120} value={Number(props.fontSize ?? 16)}
                onChange={(e) => setVal('fontSize', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              <input type="number" min={100} max={900} step={100} value={Number(props.fontWeight ?? 400)}
                onChange={(e) => setVal('fontWeight', String(e.target.value))} className={inputCls} />
            </div>
          </div>
        </section>
      )}

      {/* Raw props display */}
      <section>
        <h3 className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${t('text-gray-500', 'text-gray-400')}`}>All Properties</h3>
        <div className={`text-[10px] font-mono p-2 rounded max-h-40 overflow-y-auto ${t('bg-gray-50 text-gray-600', 'bg-gray-800 text-gray-400')}`}>
          {Object.entries(props).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => (
            <div key={k} className="flex gap-1 py-0.5">
              <span className="text-[#FF6B35] shrink-0">{k}:</span>
              <span className="truncate">{String(v)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type Tab = 'settings' | 'style';

type SelectedInfo = {
  id: string;
  name: string;
  isDeletable: boolean;
  settings: React.ComponentType | undefined;
} | null;

// ── Main panel ─────────────────────────────────────────
export const SettingsPanel = () => {
  const { t } = useEditorTheme();
  const [tab, setTab] = useState<Tab>('settings');
  const { selected } = useEditor((state): { selected: SelectedInfo } => {
    const currentNodeId = state.events.selected.values().next().value as string | undefined;
    if (!currentNodeId) return { selected: null };
    const node = state.nodes[currentNodeId];
    if (!node) return { selected: null };
    const settings = (node.related as { settings?: React.ComponentType })?.settings;
    return {
      selected: {
        id: currentNodeId,
        name: node.data.displayName ?? node.data.name ?? 'Component',
        isDeletable: node.data.parent !== null,
        settings,
      },
    };
  });

  const tabCls = (active: boolean) =>
    `flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest text-center transition-all border-b-2 ${
      active
        ? 'text-[#FF6B35] border-[#FF6B35]'
        : `border-transparent ${t('text-gray-400 hover:text-gray-600', 'text-gray-500 hover:text-gray-300')}`
    }`;

  return (
    <div className={`w-72 border-l flex flex-col shrink-0 overflow-hidden ${t(
      'bg-white border-gray-200',
      'bg-[#1e1e1e] border-gray-700/60'
    )}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${t('border-gray-200', 'border-gray-700/60')}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#FF6B35] shrink-0" />
          <span className={`text-sm font-semibold truncate ${t('text-gray-900', 'text-white')}`}>
            {selected?.name ?? 'Inspector'}
          </span>
        </div>
        {selected?.isDeletable && (
          <NodeProvider id={selected.id}>
            <DeleteNodeButton />
          </NodeProvider>
        )}
      </div>

      {/* Tabs */}
      {selected && (
        <div className={`flex shrink-0 ${t('bg-gray-50', 'bg-[#1a1a1a]')}`}>
          <button onClick={() => setTab('settings')} className={tabCls(tab === 'settings')}>⚙ Settings</button>
          <button onClick={() => setTab('style')} className={tabCls(tab === 'style')}>🎨 Style</button>
        </div>
      )}

      {/* Body */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${t('text-gray-900', 'text-white')}`}>
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <span className="text-3xl opacity-30">⚙️</span>
            <p className={`text-sm ${t('text-gray-400', 'text-gray-500')}`}>
              Select a component on the canvas to edit its properties
            </p>
          </div>
        ) : tab === 'settings' ? (
          selected.settings ? (
            <NodeProvider id={selected.id} related>
              {React.createElement(selected.settings)}
            </NodeProvider>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <span className="text-2xl opacity-30">📋</span>
              <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>
                No custom settings for this component
              </p>
            </div>
          )
        ) : (
          <NodeProvider id={selected.id}>
            <StyleManagerInner />
          </NodeProvider>
        )}
      </div>
    </div>
  );
};
