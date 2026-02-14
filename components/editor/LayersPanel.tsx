'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Square,
  Layout,
  Image,
  Type,
  MousePointer,
  FormInput,
  Box,
  Layers,
  GripVertical,
  Copy,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';

type GjsEditor = {
  getWrapper: () => GjsComponent | null;
  select: (component: GjsComponent) => void;
  getSelected: () => GjsComponent | null;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
};

type GjsComponent = {
  get: (key: string) => unknown;
  components: () => { length: number; at: (i: number) => GjsComponent; indexOf: (c: GjsComponent) => number };
  parent: () => GjsComponent | null;
  clone?: () => GjsComponent;
  remove?: (opts?: unknown) => GjsComponent;
  move?: (parent: GjsComponent, index: number) => unknown;
  [key: string]: unknown;
};

const ACCENT = '#FF6B35';

const TAG_COLORS: Record<string, string> = {
  div: '#6b7280', section: '#6b7280',
  header: '#8b5cf6', footer: '#8b5cf6', nav: '#8b5cf6',
  h1: '#3b82f6', h2: '#3b82f6', h3: '#3b82f6', h4: '#3b82f6', h5: '#3b82f6', h6: '#3b82f6',
  p: '#10b981', span: '#10b981', text: '#10b981',
  a: '#f59e0b', button: '#f59e0b',
  img: '#ec4899', video: '#ec4899',
  input: '#06b6d4', textarea: '#06b6d4', select: '#06b6d4', form: '#06b6d4',
  ul: '#6b7280', ol: '#6b7280', li: '#6b7280',
  table: '#6b7280',
};

function getIconForTag(tagName: string, compType: string) {
  const t = (tagName || '').toLowerCase();
  const type = (compType || '').toLowerCase();
  if (t === 'div' || t === 'section') return Square;
  if (t === 'header' || t === 'footer' || t === 'nav') return Layout;
  if (t === 'img' || type === 'image') return Image;
  if (t === 'input' || t === 'textarea' || type === 'input') return FormInput;
  if (t === 'button' || t === 'a' || type === 'link') return MousePointer;
  if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'text'].includes(t) || type === 'text') return Type;
  return Box;
}

function getContentPreview(component: GjsComponent): string {
  const content = component.get?.('content') as string | undefined;
  if (content && typeof content === 'string') {
    const trimmed = content.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 0) return trimmed.length > 24 ? trimmed.slice(0, 24) + '...' : trimmed;
  }
  const name = component.get?.('name') as string | undefined;
  if (name && String(name).trim()) return String(name).trim();
  const classes = (component.get?.('classes') as unknown[]) || [];
  if (Array.isArray(classes) && classes.length > 0) {
    const first = typeof classes[0] === 'string' ? classes[0] : (classes[0] as { get?: (k: string) => string })?.get?.('name') || '';
    if (first) return '.' + first;
  }
  return '';
}

export interface LayersPanelProps {
  editor: GjsEditor | null;
  isDark: boolean;
  className?: string;
}

type VisibleRow = {
  component: GjsComponent;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  parentComponent: GjsComponent | null;
  indexInParent: number;
};

function buildVisibleTree(
  wrapper: GjsComponent | null,
  expanded: Set<string>,
  getId: (c: GjsComponent) => string
): VisibleRow[] {
  if (!wrapper) return [];
  const out: VisibleRow[] = [];
  const coll = wrapper.components?.();
  if (!coll || typeof coll.length !== 'number') return [];
  const walk = (
    parentColl: { length: number; at: (i: number) => GjsComponent },
    level: number,
    parentComponent: GjsComponent | null
  ) => {
    for (let i = 0; i < parentColl.length; i++) {
      const comp = parentColl.at(i);
      if (!comp) continue;
      const id = getId(comp);
      const children = comp.components?.();
      const hasChildren = !!(children && children.length > 0);
      const isExpanded = !hasChildren || expanded.has(id);
      out.push({ component: comp, level, hasChildren, isExpanded, parentComponent, indexInParent: i });
      if (hasChildren && isExpanded && children) {
        walk(children, level + 1, comp);
      }
    }
  };
  walk(coll, 0, wrapper);
  return out;
}

function componentId(component: GjsComponent): string {
  const cid = (component as { cid?: string }).cid;
  if (typeof cid === 'string') return cid;
  return `${component.get?.('tagName')}-${Math.random().toString(36).slice(2)}`;
}

function isDescendant(ancestor: GjsComponent, descendant: GjsComponent): boolean {
  let p: GjsComponent | null = descendant;
  while (p) {
    if (p === ancestor) return true;
    p = p.parent?.() ?? null;
  }
  return false;
}

interface LayerItemProps {
  component: GjsComponent;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isDark: boolean;
  onSelect: (c: GjsComponent) => void;
  onToggleExpand: (c: GjsComponent) => void;
  onContextMenu: (e: React.MouseEvent, c: GjsComponent) => void;
  dragState: { dragging: GjsComponent | null; dropIndex: number; dropParent: GjsComponent | null };
  onDragStart: (e: React.DragEvent, c: GjsComponent) => void;
  onDragOver: (e: React.DragEvent, index: number, parent: GjsComponent | null) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetIndex: number, targetParent: GjsComponent | null) => void;
  rowIndex: number;
  parentComponent: GjsComponent | null;
  getId: (c: GjsComponent) => string;
}

function LayerItem({
  component, level, hasChildren, isExpanded, isSelected, isDark,
  onSelect, onToggleExpand, onContextMenu, dragState,
  onDragStart, onDragOver, onDragLeave, onDrop,
  rowIndex, parentComponent,
}: LayerItemProps) {
  const pl = level * 14;
  const tagName = ((component.get?.('tagName') as string) || 'div').toLowerCase();
  const compType = (component.get?.('type') as string) || '';
  const Icon = getIconForTag(tagName, compType);
  const preview = getContentPreview(component);
  const tagColor = TAG_COLORS[tagName] || '#6b7280';
  const isDragging = dragState.dragging === component;
  const showDropBefore =
    dragState.dragging &&
    dragState.dragging !== component &&
    !isDescendant(dragState.dragging, component) &&
    dragState.dropParent === parentComponent &&
    dragState.dropIndex === rowIndex;

  return (
    <>
      {showDropBefore && (
        <div className="h-0.5 w-full shrink-0" style={{ background: ACCENT, marginLeft: 12 + pl }} aria-hidden />
      )}
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        draggable
        onDragStart={(e) => onDragStart(e, component)}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(e, rowIndex, parentComponent); }}
        onDragLeave={onDragLeave}
        onDrop={(e) => { e.preventDefault(); onDrop(e, rowIndex, parentComponent); }}
        onClick={() => onSelect(component)}
        onContextMenu={(e) => onContextMenu(e, component)}
        className={`
          group flex items-center gap-1.5 py-1.5 text-[13px] cursor-pointer select-none
          transition-all duration-100
          ${isDark ? 'border-b border-[#3a3a3a]' : 'border-b border-gray-100'}
          ${isSelected ? '' : isDark ? 'hover:bg-[#3a3a3a]' : 'hover:bg-gray-50'}
          ${isDragging ? 'opacity-40' : ''}
        `}
        style={{
          paddingLeft: 8 + pl,
          paddingRight: 8,
          backgroundColor: isSelected ? (isDark ? 'rgba(255,107,53,0.15)' : 'rgba(255,107,53,0.08)') : undefined,
          borderLeft: isSelected ? `2px solid ${ACCENT}` : '2px solid transparent',
        }}
      >
        {/* Tree line connector */}
        {level > 0 && (
          <span
            className="absolute opacity-20"
            style={{
              left: 8 + (level - 1) * 14 + 6,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: isDark ? '#6a6a6a' : '#d1d5db',
            }}
          />
        )}

        {/* Drag handle (visible on hover) */}
        <GripVertical className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab" />

        {/* Expand/collapse */}
        <button
          type="button"
          className="shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(component); }}
        >
          {hasChildren ? (
            isExpanded
              ? <ChevronDown className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}
        </button>

        {/* Icon */}
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isSelected ? ACCENT : (isDark ? '#9ca3af' : '#6b7280') }} />

        {/* Tag badge */}
        <span
          className="shrink-0 text-[10px] font-mono font-semibold px-1 py-0.5 rounded leading-none"
          style={{
            backgroundColor: isSelected ? ACCENT : tagColor,
            color: '#fff',
            opacity: isSelected ? 1 : 0.85,
          }}
        >
          {tagName.toUpperCase()}
        </span>

        {/* Content preview */}
        {preview && (
          <span className="truncate text-xs text-gray-500 dark:text-gray-400 min-w-0">
            {preview}
          </span>
        )}

        {/* Child count */}
        {hasChildren && (
          <span className="ml-auto shrink-0 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
            {component.components?.()?.length || 0}
          </span>
        )}
      </div>
    </>
  );
}

export function LayersPanel({ editor, isDark, className = '' }: LayersPanelProps) {
  const [treeKey, setTreeKey] = useState(0);
  const [selected, setSelected] = useState<GjsComponent | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<{
    dragging: GjsComponent | null;
    dropIndex: number;
    dropParent: GjsComponent | null;
  }>({ dragging: null, dropIndex: -1, dropParent: null });
  const idCache = useRef<WeakMap<GjsComponent, string>>(new WeakMap());

  const refreshTree = useCallback(() => setTreeKey((k) => k + 1), []);

  const getId = useCallback((c: GjsComponent) => {
    let id = idCache.current.get(c);
    if (!id) {
      id = (c as { cid?: string }).cid ?? `c-${Math.random().toString(36).slice(2)}`;
      idCache.current.set(c, id);
    }
    return id;
  }, []);

  useEffect(() => {
    if (!editor) return;
    const onSelect = (...args: unknown[]) => { const c = args[0] as GjsComponent; setSelected(c); };
    const onUpdate = (..._args: unknown[]) => refreshTree();
    editor.on('component:selected', onSelect);
    editor.on('component:add', onUpdate);
    editor.on('component:remove', onUpdate);
    editor.on('component:update', onUpdate);
    return () => {
      const off = (ed: GjsEditor, ev: string, fn: (...args: unknown[]) => void) => {
        if (typeof (ed as unknown as { off?: (e: string, f: (...a: unknown[]) => void) => void }).off === 'function') {
          (ed as unknown as { off: (e: string, f: (...a: unknown[]) => void) => void }).off(ev, fn);
        }
      };
      off(editor, 'component:selected', onSelect);
      off(editor, 'component:add', onUpdate);
      off(editor, 'component:remove', onUpdate);
      off(editor, 'component:update', onUpdate);
    };
  }, [editor, refreshTree]);

  useEffect(() => {
    if (!editor) return;
    setSelected(editor.getSelected?.() ?? null);
  }, [editor, treeKey]);

  const wrapper = editor?.getWrapper?.() ?? null;
  const visibleRows = buildVisibleTree(wrapper, expanded, getId);

  const handleSelect = useCallback((component: GjsComponent) => {
    setSelected(component);
    editor?.select?.(component);
  }, [editor]);

  const toggleExpand = useCallback((component: GjsComponent) => {
    const id = componentId(component);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, component: GjsComponent) => {
    setDragState({ dragging: component, dropIndex: -1, dropParent: null });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', getId(component));
  }, [getId]);

  const handleDragOver = useCallback((_e: React.DragEvent, index: number, parent: GjsComponent | null) => {
    setDragState((s) => (s.dragging ? { ...s, dropIndex: index, dropParent: parent } : s));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState((s) => (s.dragging ? { ...s, dropIndex: -1, dropParent: null } : s));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number, targetParent: GjsComponent | null) => {
      e.preventDefault();
      const { dragging } = dragState;
      if (!dragging || !editor) { setDragState({ dragging: null, dropIndex: -1, dropParent: null }); return; }
      const wrapperNode = editor.getWrapper?.();
      if (!wrapperNode) { setDragState({ dragging: null, dropIndex: -1, dropParent: null }); return; }
      const parent = targetParent ?? wrapperNode;
      const coll = parent.components?.();
      if (!coll) { setDragState({ dragging: null, dropIndex: -1, dropParent: null }); return; }
      const currentIndex = coll.indexOf?.(dragging);
      let newIndex = targetIndex;
      if (currentIndex >= 0 && parent === dragging.parent?.()) {
        if (targetIndex > currentIndex) newIndex = targetIndex - 1;
      }
      if (typeof dragging.move === 'function') {
        dragging.move!(parent, Math.max(0, newIndex));
      }
      refreshTree();
      setDragState({ dragging: null, dropIndex: -1, dropParent: null });
    },
    [dragState, editor, refreshTree]
  );

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; component: GjsComponent } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, component: GjsComponent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, component });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => { window.removeEventListener('click', close); window.removeEventListener('contextmenu', close); };
  }, [contextMenu]);

  const runContextAction = useCallback(
    (action: 'duplicate' | 'delete' | 'moveUp' | 'moveDown') => {
      const comp = contextMenu?.component;
      if (!comp || !editor) { setContextMenu(null); return; }
      const parent = comp.parent?.();
      const coll = parent?.components?.();
      if (action === 'delete' && comp.remove) {
        comp.remove();
      } else if (action === 'duplicate' && comp.clone) {
        const clone = comp.clone();
        if (parent && clone) {
          const idx = coll ? coll.indexOf(comp) + 1 : 0;
          const append = (parent as GjsComponent & { append?: (c: GjsComponent, opts?: { at?: number }) => unknown }).append;
          if (typeof append === 'function') append.call(parent, clone, { at: idx });
        }
      } else if (action === 'moveUp' && coll && parent) {
        const i = coll.indexOf(comp);
        if (i > 0 && typeof comp.move === 'function') comp.move(parent, i - 1);
      } else if (action === 'moveDown' && coll && parent) {
        const i = coll.indexOf(comp);
        if (i >= 0 && i < coll.length - 1 && typeof comp.move === 'function') comp.move(parent, i + 1);
      }
      refreshTree();
      setContextMenu(null);
    },
    [contextMenu, editor, refreshTree]
  );

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{ color: isDark ? '#e5e5e5' : '#1a1a1a' }}
    >
      <div className="flex-1 overflow-y-auto relative">
        {visibleRows.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gray-100 dark:bg-[#3a3a3a] flex items-center justify-center">
              <Layers className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Canvas is empty</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Drag components to start building</p>
          </div>
        ) : (
          <div role="tree" aria-label="Layers" key={treeKey}>
            {visibleRows.map((row) => (
              <LayerItem
                key={getId(row.component)}
                component={row.component}
                level={row.level}
                hasChildren={row.hasChildren}
                isExpanded={row.isExpanded}
                isSelected={selected === row.component}
                isDark={isDark}
                onSelect={handleSelect}
                onToggleExpand={toggleExpand}
                onContextMenu={handleContextMenu}
                dragState={dragState}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                rowIndex={row.indexInParent}
                parentComponent={row.parentComponent}
                getId={getId}
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed z-[100] py-1 min-w-[160px] rounded-lg shadow-xl text-sm border backdrop-blur-sm"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: isDark ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? '#4a4a4a' : '#e5e5e5',
          }}
        >
          {[
            { action: 'duplicate' as const, label: 'Duplicate', icon: Copy, color: undefined },
            { action: 'moveUp' as const, label: 'Move up', icon: ArrowUp, color: undefined },
            { action: 'moveDown' as const, label: 'Move down', icon: ArrowDown, color: undefined },
            { action: 'delete' as const, label: 'Delete', icon: Trash2, color: 'text-red-500' },
          ].map(({ action, label, icon: MenuIcon, color }) => (
            <button
              key={action}
              type="button"
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#FF6B35]/10 transition-colors ${color || ''}`}
              onClick={() => runContextAction(action)}
            >
              <MenuIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
