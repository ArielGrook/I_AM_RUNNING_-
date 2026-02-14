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
} from 'lucide-react';

/** Minimal GrapesJS editor/component types for Layers panel */
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
const borderDark = '#4a4a4a';
const borderLight = '#e5e5e5';
const bgDark = '#2d2d2d';
const bgLight = '#f5f5f5';
const textDark = '#e5e5e5';
const textLight = '#1a1a1a';
const hoverDark = '#3a3a3a';
const hoverLight = '#e5e5e5';
const selectedBg = 'rgba(255, 107, 53, 0.2)';

function getIconForTag(tagName: string, compType: string) {
  const t = (tagName || '').toLowerCase();
  const type = (compType || '').toLowerCase();
  if (t === 'div' || t === 'section') return Square;
  if (t === 'header' || t === 'footer') return Layout;
  if (t === 'img' || type === 'image') return Image;
  if (t === 'input' || type === 'input') return FormInput;
  if (t === 'button' || t === 'a' || type === 'link') return MousePointer;
  if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'text'].includes(t) || type === 'text') return Type;
  return Box;
}

function getLabel(component: GjsComponent): string {
  const name = component.get?.('name') as string | undefined;
  if (name && String(name).trim()) return String(name).trim();
  const tag = (component.get?.('tagName') as string) || 'div';
  const type = (component.get?.('type') as string) || '';
  if (type) return type;
  return tag;
}

function getTagLabel(component: GjsComponent): string {
  const tag = (component.get?.('tagName') as string) || 'div';
  const type = (component.get?.('type') as string) || '';
  if (type) return type;
  return tag;
}

export interface LayersPanelProps {
  editor: GjsEditor | null;
  isDark: boolean;
  className?: string;
}

/** Build flat list of { component, level } from wrapper for rendering */
function buildTree(wrapper: GjsComponent | null): Array<{ component: GjsComponent; level: number }> {
  if (!wrapper) return [];
  const out: Array<{ component: GjsComponent; level: number }> = [];
  const coll = wrapper.components?.();
  if (!coll || typeof coll.length !== 'number') return [];
  for (let i = 0; i < coll.length; i++) {
    const comp = coll.at(i);
    if (!comp) continue;
    const walk = (c: GjsComponent, level: number) => {
      out.push({ component: c, level });
      const children = c.components?.();
      if (children && children.length > 0) {
        for (let j = 0; j < children.length; j++) {
          const child = children.at(j);
          if (child) walk(child, level + 1);
        }
      }
    };
    walk(comp, 0);
  }
  return out;
}

type VisibleRow = {
  component: GjsComponent;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  parentComponent: GjsComponent | null;
  indexInParent: number;
};

/** Get tree that respects expanded state: only show children when parent is expanded */
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
      out.push({
        component: comp,
        level,
        hasChildren,
        isExpanded,
        parentComponent,
        indexInParent: i,
      });
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
  component,
  level,
  hasChildren,
  isExpanded,
  isSelected,
  isDark,
  onSelect,
  onToggleExpand,
  onContextMenu,
  dragState,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  rowIndex,
  parentComponent,
  getId,
}: LayerItemProps) {
  const pl = level * 16;
  const tagName = (component.get?.('tagName') as string) || 'div';
  const Icon = getIconForTag(tagName, (component.get?.('type') as string) || '');
  const label = getLabel(component);
  const tagLabel = getTagLabel(component);
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
        <div
          className="h-0.5 w-full shrink-0"
          style={{ background: ACCENT, marginLeft: pl }}
          aria-hidden
        />
      )}
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        draggable
        onDragStart={(e) => onDragStart(e, component)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOver(e, rowIndex, parentComponent);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(e, rowIndex, parentComponent);
        }}
        onClick={() => onSelect(component)}
        onContextMenu={(e) => onContextMenu(e, component)}
        className={`
          flex items-center gap-2 py-2 px-3 text-sm border-b cursor-pointer select-none
          transition-colors duration-150
          ${isDark ? 'border-[#4a4a4a]' : 'border-[#e5e5e5]'}
          ${isSelected ? '' : isDark ? 'hover:bg-[#3a3a3a]' : 'hover:bg-[#e5e5e5]'}
          ${isDragging ? 'opacity-50' : ''}
        `}
        style={{
          paddingLeft: 12 + pl,
          backgroundColor: isSelected ? selectedBg : undefined,
          borderLeft: isSelected ? `3px solid ${ACCENT}` : undefined,
          color: isDark ? textDark : textLight,
        }}
      >
        <button
          type="button"
          className="shrink-0 p-0.5 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#FF6B35]"
          style={{ color: ACCENT }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(component);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4 h-4 inline-block" aria-hidden />
          )}
        </button>
        <Icon className="w-4 h-4 shrink-0 opacity-90" style={{ color: isDark ? textDark : textLight }} />
        <span className="truncate flex-1 min-w-0" title={label}>
          {label}
        </span>
        <span
          className="shrink-0 text-xs opacity-70"
          style={{ color: isDark ? textDark : textLight }}
        >
          {tagLabel}
        </span>
      </div>
    </>
  );
}

function isDescendant(ancestor: GjsComponent, descendant: GjsComponent): boolean {
  let p: GjsComponent | null = descendant;
  while (p) {
    if (p === ancestor) return true;
    p = p.parent?.() ?? null;
  }
  return false;
}

export function LayersPanel({ editor, isDark, className = '' }: LayersPanelProps) {
  const [treeKey, setTreeKey] = useState(0);
  const [selected, setSelected] = useState<GjsComponent | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<{
    dragging: GjsComponent | null;
    dropIndex: number;
    dropParent: GjsComponent | null; // parent component (or wrapper) where we would drop
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
    const onSelect = (component: GjsComponent) => setSelected(component);
    const onUpdate = () => refreshTree();
    editor.on('component:selected', onSelect);
    editor.on('component:add', onUpdate);
    editor.on('component:remove', onUpdate);
    editor.on('component:update', onUpdate);
    return () => {
      const off = (ed: GjsEditor, ev: string, fn: (...args: unknown[]) => void) => {
        if (typeof (ed as unknown as { off?: (e: string, f: () => void) => void }).off === 'function') {
          (ed as unknown as { off: (e: string, f: () => void) => void }).off(ev, fn);
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
    const sel = editor.getSelected?.() ?? null;
    setSelected(sel);
  }, [editor, treeKey]);

  const wrapper = editor?.getWrapper?.() ?? null;
  const visibleRows = buildVisibleTree(wrapper, expanded, getId);

  const handleSelect = useCallback(
    (component: GjsComponent) => {
      setSelected(component);
      editor?.select?.(component);
    },
    [editor]
  );

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
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'gjs-layer', id: getId(component) }));
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
      if (!dragging || !editor) {
        setDragState({ dragging: null, dropIndex: -1, dropParent: null });
        return;
      }
      const wrapper = editor.getWrapper?.();
      if (!wrapper) {
        setDragState({ dragging: null, dropIndex: -1, dropParent: null });
        return;
      }
      const parent = targetParent ?? wrapper;
      const coll = parent.components?.();
      if (!coll) {
        setDragState({ dragging: null, dropIndex: -1, dropParent: null });
        return;
      }
      const currentIndex = coll.indexOf?.(dragging);
      let newIndex = targetIndex;
      if (currentIndex >= 0 && parent === dragging.parent?.()) {
        if (targetIndex > currentIndex) newIndex = targetIndex - 1;
      }
      if (typeof (dragging as GjsComponent).move === 'function') {
        (dragging as GjsComponent).move(parent, Math.max(0, newIndex));
      }
      refreshTree();
      setDragState({ dragging: null, dropIndex: -1, dropParent: null });
    },
    [dragState, editor, refreshTree]
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    component: GjsComponent;
  } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, component: GjsComponent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, component });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [contextMenu]);

  const runContextAction = useCallback(
    (action: 'duplicate' | 'delete' | 'moveUp' | 'moveDown') => {
      const comp = contextMenu?.component;
      if (!comp || !editor) {
        setContextMenu(null);
        return;
      }
      const parent = comp.parent?.();
      const coll = parent?.components?.();
      if (action === 'delete' && comp.remove) {
        comp.remove();
      } else if (action === 'duplicate' && comp.clone) {
        const clone = comp.clone();
        if (parent && clone) {
          const idx = coll ? coll.indexOf(comp) + 1 : 0;
          const append = (parent as GjsComponent & { append?: (c: GjsComponent, opts?: { at?: number }) => unknown }).append;
          if (typeof append === 'function') {
            append.call(parent, clone, { at: idx });
          }
        }
      } else if (action === 'moveUp' && coll && parent) {
        const i = coll.indexOf(comp);
        if (i > 0 && typeof (comp as GjsComponent).move === 'function') {
          (comp as GjsComponent).move(parent, i - 1);
        }
      } else if (action === 'moveDown' && coll && parent) {
        const i = coll.indexOf(comp);
        if (i >= 0 && i < coll.length - 1 && typeof (comp as GjsComponent).move === 'function') {
          (comp as GjsComponent).move(parent, i + 1);
        }
      }
      refreshTree();
      setContextMenu(null);
    },
    [contextMenu, editor, refreshTree]
  );

  const bg = isDark ? bgDark : bgLight;
  const borderColor = isDark ? borderDark : borderLight;

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{ backgroundColor: bg, color: isDark ? textDark : textLight }}
    >
      <div
        className="flex-1 overflow-y-auto border-t shrink-0"
        style={{ borderColor }}
      >
        {visibleRows.length === 0 ? (
          <div className="py-6 px-4 text-center text-sm opacity-70" style={{ color: isDark ? textDark : textLight }}>
            No layers. Add components from the Components tab.
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
          className="fixed z-[100] py-1 min-w-[160px] rounded-md shadow-lg text-sm border"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: isDark ? bgDark : bgLight,
            borderColor,
            color: isDark ? textDark : textLight,
          }}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-[#FF6B35]/20"
            onClick={() => runContextAction('duplicate')}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-[#FF6B35]/20"
            onClick={() => runContextAction('moveUp')}
          >
            Move up
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-[#FF6B35]/20"
            onClick={() => runContextAction('moveDown')}
          >
            Move down
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-500/20"
            onClick={() => runContextAction('delete')}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
