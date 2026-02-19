'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';

export type HtmlBlockProps = {
  rawHtml?: string;
  rawCss?: string;
  blockType?: string;
  label?: string;
};

export const HtmlBlock = ({
  rawHtml = '',
  rawCss = '',
  blockType = 'section',
  label,
}: HtmlBlockProps) => {
  const {
    connectors: { connect, drag },
    isSelected,
  } = useNode((n) => ({
    isSelected: n.events.selected,
  }));
  const { enabled } = useEditor((s) => ({ enabled: s.options.enabled }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={isSelected ? 'outline outline-2 outline-orange-500 outline-offset-2' : ''}
      style={{ position: 'relative', width: '100%' }}
    >
      {rawCss ? <style dangerouslySetInnerHTML={{ __html: rawCss }} /> : null}
      {rawHtml ? (
        <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
      ) : null}
      {enabled && isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.7)',
            color: '#94a3b8',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {label || blockType || 'HTML Block'}
        </div>
      )}
    </div>
  );
};

const HtmlBlockSettings = () => {
  const {
    actions: { setProp },
  } = useNode((n) => ({
    rawHtml: n.data.props.rawHtml as string,
    rawCss: n.data.props.rawCss as string,
    label: n.data.props.label as string,
  }));

  const rawHtml = useNode((n) => n.data.props.rawHtml as string);
  const rawCss = useNode((n) => n.data.props.rawCss as string);
  const label = useNode((n) => n.data.props.label as string);

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Block Name
        </label>
        <input
          type="text"
          value={label ?? ''}
          onChange={(e) =>
            setProp((p: HtmlBlockProps) => {
              p.label = e.target.value;
            }, 500)
          }
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          HTML
        </label>
        <textarea
          value={rawHtml ?? ''}
          onChange={(e) =>
            setProp((p: HtmlBlockProps) => {
              p.rawHtml = e.target.value;
            }, 500)
          }
          rows={10}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-xs"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          CSS
        </label>
        <textarea
          value={rawCss ?? ''}
          onChange={(e) =>
            setProp((p: HtmlBlockProps) => {
              p.rawCss = e.target.value;
            }, 500)
          }
          rows={6}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-xs"
        />
      </div>
    </div>
  );
};

HtmlBlock.craft = {
  displayName: 'HTML Block',
  props: {
    rawHtml: '',
    rawCss: '',
    blockType: 'section',
    label: 'HTML Block',
  },
  related: { settings: HtmlBlockSettings },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
  },
};
