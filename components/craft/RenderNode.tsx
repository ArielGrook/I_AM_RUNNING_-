'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useEffect } from 'react';

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const { id } = useNode();

  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const { isActive, isHover, dom, name, parent } = useNode((node) => ({
    isActive: node.events.selected,
    isHover: node.events.hovered,
    dom: node.dom,
    name:
      (node.data.custom as { displayName?: string } | undefined)?.displayName ||
      node.data.displayName ||
      node.data.name,
    parent: node.data.parent,
  }));

  const moveable = query.node(id).isDraggable();
  const deletable = query.node(id).isDeletable();

  // Apply CSS classes to the actual DOM node for hover/select ring
  useEffect(() => {
    if (!dom) return;
    dom.classList.toggle('craft-node-hovered', !!(isHover && !isActive));
    dom.classList.toggle('craft-node-selected', !!isActive);
    return () => {
      dom.classList.remove('craft-node-hovered', 'craft-node-selected');
    };
  }, [dom, isActive, isHover]);

  if (!enabled) return <>{render}</>;

  return (
    <div style={{ position: 'relative', display: 'contents' }}>
      {(isHover || isActive) && (
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: 22,
            padding: '0 6px',
            background: isActive ? '#FF6B35' : 'rgba(255,107,53,0.75)',
            borderRadius: '4px 4px 0 0',
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            pointerEvents: 'all',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <span>{name}</span>
          {parent && (
            <button
              style={btnStyle}
              title="Select parent"
              onClick={() => actions.selectNode(parent)}
            >
              ↑
            </button>
          )}
          {deletable && (
            <button
              style={{ ...btnStyle, color: '#ffcccc' }}
              title="Delete"
              onClick={() => actions.delete(id)}
            >
              ✕
            </button>
          )}
        </div>
      )}
      {render}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: '0 2px',
  fontSize: 12,
  lineHeight: 1,
};
