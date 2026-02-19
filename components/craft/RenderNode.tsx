'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useEffect, useRef, useState, useCallback } from 'react';

const BADGE_H = 22;

const ICONS: Record<string, string> = {
  Container: '▦', Text: 'T', Button: '▣', Image: '🖼',
  Hero: '◉', CTA: '▶', Features: '✦', Header: '☰', Footer: '▬',
};

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const { id } = useNode();
  const { actions, query } = useEditor();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const { isActive, isHover, isDragged, dom, name, parent, isCanvas } = useNode((node) => ({
    isActive: node.events.selected,
    isHover: node.events.hovered,
    isDragged: node.events.dragged,
    dom: node.dom,
    name:
      (node.data.custom as { displayName?: string } | undefined)?.displayName ||
      node.data.displayName ||
      node.data.name,
    parent: node.data.parent,
    isCanvas: node.data.isCanvas,
  }));

  const deletable = query.node(id).isDeletable();
  const badgeRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePos = useCallback(() => {
    if (!dom) return;
    const rect = dom.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left, width: rect.width });
  }, [dom]);

  // Outline classes
  useEffect(() => {
    if (!dom) return;
    dom.classList.toggle('craft-node-hovered', !!(isHover && !isActive));
    dom.classList.toggle('craft-node-selected', !!isActive);
    return () => {
      dom.classList.remove('craft-node-hovered', 'craft-node-selected');
    };
  }, [dom, isActive, isHover]);

  // Canvas drop zone indicator — highlight canvas containers during drag
  useEffect(() => {
    if (!dom || !isCanvas) return;
    const editor = query.getState();
    const dragging = editor.events.dragged.size > 0;
    dom.classList.toggle('craft-canvas-drop-zone', dragging);
    return () => { dom.classList.remove('craft-canvas-drop-zone'); };
  }, [dom, isCanvas, query]);

  // Track position
  useEffect(() => {
    if (!dom || (!isActive && !isHover)) { setPos(null); return; }
    updatePos();
    const scrollEl = dom.closest('.craft-viewport-scroll') ?? document;
    const onScroll = () => updatePos();
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [dom, isActive, isHover, updatePos]);

  if (!enabled) return <>{render}</>;

  const showBadge = (isActive || isHover) && pos && !isDragged;
  const icon = ICONS[name ?? ''] ?? '•';

  return (
    <>
      {showBadge && (
        <div
          ref={badgeRef}
          style={{
            position: 'fixed',
            top: pos.top > BADGE_H ? pos.top - BADGE_H : pos.top + 2,
            left: pos.left,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            height: BADGE_H,
            padding: '0 7px',
            background: isActive ? '#FF6B35' : 'rgba(255,107,53,0.85)',
            borderRadius: pos.top > BADGE_H ? '4px 4px 0 0' : '0 0 4px 4px',
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            pointerEvents: 'all',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ opacity: 0.65, fontSize: 9 }}>{icon}</span>
          <span>{name}</span>
          {isActive && parent && (
            <button
              style={btnStyle}
              title="Select parent"
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); actions.selectNode(parent); }}
            >
              ↑
            </button>
          )}
          {isActive && deletable && (
            <button
              style={{ ...btnStyle, color: '#ffcccc' }}
              title="Delete"
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); actions.delete(id); }}
            >
              ✕
            </button>
          )}
        </div>
      )}
      {render}
    </>
  );
};

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.18)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: '1px 4px',
  fontSize: 11,
  lineHeight: 1,
  borderRadius: 3,
  display: 'flex',
  alignItems: 'center',
};
