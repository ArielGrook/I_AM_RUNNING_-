'use client';

import { useNode } from '@craftjs/core';
import React, { useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export const Image = ({
  src = 'https://via.placeholder.com/800x400',
  alt = 'Image',
  width = '100%',
  borderRadius = 0,
}: {
  src?: string;
  alt?: string;
  width?: string;
  borderRadius?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ display: 'block', width: width === '100%' ? '100%' : width }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: width === '100%' ? '100%' : width,
          borderRadius: `${borderRadius}px`,
          display: 'block',
        }}
      />
    </div>
  );
};

const ImageSettings = () => {
  const {
    actions: { setProp },
    src,
    alt,
    width,
    borderRadius,
  } = useNode((node) => ({
    src:          node.data.props.src as string,
    alt:          node.data.props.alt as string,
    width:        node.data.props.width as string,
    borderRadius: node.data.props.borderRadius as number,
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const supabase = getSupabaseClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('images')
        .upload(fileName, file, { upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setProp((p: Record<string, unknown>) => { p.src = urlData.publicUrl; });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Image</h3>
        <div className="space-y-3">
          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="img-upload"
            />
            <label
              htmlFor="img-upload"
              className={`flex items-center justify-center gap-2 w-full py-2 rounded border border-dashed cursor-pointer text-sm transition-colors ${
                uploading
                  ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                  : 'border-[#FF6B35]/60 text-[#FF6B35] hover:border-[#FF6B35] hover:bg-[#FF6B35]/10'
              }`}
            >
              {uploading ? '⏳ Uploading…' : '📁 Upload Image'}
            </label>
            {uploadError && (
              <p className="text-red-400 text-xs mt-1">{uploadError}</p>
            )}
          </div>
          {/* Preview */}
          {src && !src.includes('placeholder') && (
            <div className="rounded overflow-hidden border border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="preview" className="w-full h-20 object-cover" />
            </div>
          )}
          {/* URL fallback */}
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Or paste URL</label>
            <input
              type="text"
              value={src ?? ''}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.src = e.target.value; })}
              className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white font-mono"
              placeholder="https://..."
            />
          </div>
          {/* Alt text */}
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Alt Text</label>
            <input
              type="text"
              value={alt ?? ''}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.alt = e.target.value; })}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white"
            />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Width</label>
            <div className="flex gap-1">
              {['100%', '75%', '50%', '33%'].map((w) => (
                <button
                  key={w}
                  onClick={() => setProp((p: Record<string, unknown>) => { p.width = w; })}
                  className={`flex-1 py-1 text-xs rounded border transition-colors ${
                    width === w
                      ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10'
                      : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Border Radius — {borderRadius ?? 0}px
            </label>
            <input
              type="range" min="0" max="50" value={borderRadius ?? 0}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.borderRadius = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

Image.craft = {
  displayName: 'Image',
  props: {
    src: 'https://via.placeholder.com/800x400',
    alt: 'Image',
    width: '100%',
    borderRadius: 0,
  },
  related: {
    settings: ImageSettings,
  },
};
