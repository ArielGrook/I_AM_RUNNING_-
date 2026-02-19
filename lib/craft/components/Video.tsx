'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Video = ({
  url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  aspectRatio = '16/9',
  borderRadius = 12,
  maxWidth = 100,
}: {
  url?: string;
  aspectRatio?: string;
  borderRadius?: number;
  maxWidth?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        width: `${maxWidth}%`,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio,
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <iframe
          src={url}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video embed"
        />
      </div>
    </div>
  );
};

const VideoSettings = () => {
  const {
    actions: { setProp },
    url, borderRadius, maxWidth, aspectRatio,
  } = useNode((node) => ({
    url:          node.data.props.url as string,
    borderRadius: node.data.props.borderRadius as number,
    maxWidth:     node.data.props.maxWidth as number,
    aspectRatio:  node.data.props.aspectRatio as string,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Video</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Embed URL</label>
            <input
              type="text"
              value={url ?? ''}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.url = e.target.value; })}
              className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white font-mono"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Aspect Ratio</label>
            <div className="flex gap-1">
              {['16/9', '4/3', '1/1', '9/16'].map((r) => (
                <button key={r} onClick={() => setProp((p: Record<string, unknown>) => { p.aspectRatio = r; })}
                  className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
                    aspectRatio === r ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Width — {maxWidth ?? 100}%</label>
            <input type="range" min="30" max="100" value={maxWidth ?? 100}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.maxWidth = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Border Radius — {borderRadius ?? 12}px</label>
            <input type="range" min="0" max="40" value={borderRadius ?? 12}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.borderRadius = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]" />
          </div>
        </div>
      </section>
    </div>
  );
};

Video.craft = {
  displayName: 'Video',
  props: {
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    aspectRatio: '16/9',
    borderRadius: 12,
    maxWidth: 100,
  },
  rules: {
    canDrag: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: VideoSettings,
  },
};
