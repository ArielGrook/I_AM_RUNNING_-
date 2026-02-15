/**
 * Layers panel for Puck editor: walks Puck data tree and shows component hierarchy.
 */

'use client';

import React, { useMemo } from 'react';
import { ChevronRight, ChevronDown, Type, Layout, Image, Box } from 'lucide-react';

type PuckData = Record<string, unknown>;

type TreeItem = {
  id: string;
  type: string;
  label: string;
  children: TreeItem[];
};

function getIcon(type: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('heading') || t.includes('text')) return Type;
  if (t.includes('hero') || t.includes('section')) return Layout;
  if (t.includes('image') || t.includes('img')) return Image;
  return Box;
}

function walkContent(content: unknown, parentPath: string): TreeItem[] {
  if (!Array.isArray(content)) return [];
  const items: TreeItem[] = [];
  content.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const obj = item as Record<string, unknown>;
    const id = (obj.id as string) || `${parentPath}[${index}]`;
    const type = (obj.type as string) || 'Block';
    const props = (obj.props as Record<string, unknown>) || {};
    const label = (props.children as string) || (props.text as string) || (props.title as string) || type || 'Block';
    const str = typeof label === 'string' ? label : type;
    const children: TreeItem[] = [];
    if (obj.props && typeof obj.props === 'object') {
      const propsObj = obj.props as Record<string, unknown>;
      for (const [key, value] of Object.entries(propsObj)) {
        if (key === 'zone' && value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).content)) {
          children.push(...walkContent((value as { content: unknown }).content, `${id}.${key}`));
        } else if (Array.isArray(value)) {
          const nested = walkContent(value, `${id}.${key}`);
          if (nested.length) children.push(...nested);
        }
      }
    }
    items.push({ id, type, label: str.slice(0, 32), children });
  });
  return items;
}

function buildTree(data: PuckData): TreeItem[] {
  const items: TreeItem[] = [];
  const root = data.root as Record<string, unknown> | undefined;
  const content = data.content as unknown[] | undefined;
  const zones = data.zones as Record<string, unknown> | undefined;

  if (root && typeof root === 'object') {
    const rootProps = root.props as Record<string, unknown> | undefined;
    if (rootProps) {
      for (const [key, value] of Object.entries(rootProps)) {
        if (key === 'zone' && value && typeof value === 'object') {
          const zoneContent = (value as { content?: unknown }).content;
          if (Array.isArray(zoneContent)) {
            items.push(...walkContent(zoneContent, 'root.' + key));
          }
        }
      }
    }
  }

  if (Array.isArray(content) && content.length > 0) {
    items.push(...walkContent(content, 'content'));
  }

  if (zones && typeof zones === 'object') {
    for (const [zoneName, zoneValue] of Object.entries(zones)) {
      const arr = Array.isArray(zoneValue) ? zoneValue : (zoneValue as { content?: unknown[] })?.content;
      if (Array.isArray(arr)) {
        const zoneItems = walkContent(arr, `zones.${zoneName}`);
        zoneItems.forEach((item) => item.label = `[${zoneName}] ${item.label}`);
        items.push(...zoneItems);
      }
    }
  }

  return items;
}

function TreeRow({ item, depth = 0 }: { item: TreeItem; depth?: number }) {
  const [open, setOpen] = React.useState(true);
  const Icon = getIcon(item.type);
  const hasChildren = item.children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded text-sm cursor-pointer"
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" /> : <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
        ) : (
          <span className="w-4" />
        )}
        <Icon className="w-4 h-4 shrink-0 text-[#FF6B35]" />
        <span className="truncate text-gray-900 dark:text-[#e5e5e5]">{item.label}</span>
      </div>
      {hasChildren && open && (
        <div>
          {item.children.map((child) => (
            <TreeRow key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export interface LayersPanelPuckProps {
  data: PuckData;
  className?: string;
}

export function LayersPanelPuck({ data, className }: LayersPanelPuckProps) {
  const tree = useMemo(() => buildTree(data), [data]);

  return (
    <div className={className ?? 'flex-1 min-h-0 overflow-y-auto p-2'}>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 pb-2">Layers</div>
      {tree.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-2">No layers yet. Add components from the canvas.</p>
      ) : (
        tree.map((item) => <TreeRow key={item.id} item={item} />)
      )}
    </div>
  );
}
