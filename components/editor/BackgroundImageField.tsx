/**
 * Background image upload field for Puck: Supabase Storage, preview, opacity, size, position.
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Upload, Trash2 } from 'lucide-react';

const BUCKET = 'project-assets';

export interface BackgroundImageValue {
  url?: string;
  opacity?: number;
  backgroundSize?: 'cover' | 'contain';
  backgroundPosition?: string;
}

const POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top left', label: 'Top left' },
  { value: 'top right', label: 'Top right' },
  { value: 'bottom left', label: 'Bottom left' },
  { value: 'bottom right', label: 'Bottom right' },
];

interface BackgroundImageFieldProps {
  value?: BackgroundImageValue | null;
  onChange: (v: BackgroundImageValue) => void;
  className?: string;
}

export function BackgroundImageField({ value, onChange, className }: BackgroundImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = value?.url ?? '';
  const opacity = value?.opacity ?? 100;
  const backgroundSize = value?.backgroundSize ?? 'cover';
  const backgroundPosition = value?.backgroundPosition ?? 'center';

  const update = useCallback(
    (patch: Partial<BackgroundImageValue>) => {
      onChange({ url, opacity, backgroundSize, backgroundPosition, ...patch });
    },
    [onChange, url, opacity, backgroundSize, backgroundPosition]
  );

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const path = `editor/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (urlData?.publicUrl) update({ url: urlData.publicUrl });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [update]
  );

  const handleRemove = useCallback(() => {
    update({ url: '' });
  }, [update]);

  return (
    <div className={cn('background-image-field space-y-4', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Background image</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#FF6B35] hover:bg-[#e55a28] disabled:opacity-50 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          {url && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-[#e5e5e5] border border-[#e5e5e5] dark:border-[#4a4a4a] hover:border-red-500 rounded-lg transition-colors"
              title="Remove background"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      {url && (
        <>
          <div
            className="w-full h-24 rounded-lg border border-[#e5e5e5] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#2d2d2d] bg-cover bg-center"
            style={{
              backgroundImage: `url(${url})`,
              opacity: opacity / 100,
              backgroundSize,
              backgroundPosition,
            }}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Opacity (%)</Label>
              <span className="text-xs text-gray-500 font-mono">{opacity}</span>
            </div>
            <Slider
              value={[opacity]}
              onValueChange={([v]) => update({ opacity: v })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Size</Label>
            <div className="flex gap-1">
              {(['cover', 'contain'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update({ backgroundSize: s })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs font-medium rounded border transition-all capitalize',
                    backgroundSize === s
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'bg-[#f5f5f5] dark:bg-[#2d2d2d] text-gray-700 dark:text-[#e5e5e5] border-[#e5e5e5] dark:border-[#4a4a4a] hover:border-[#FF6B35]'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Position</Label>
            <select
              value={backgroundPosition}
              onChange={(e) => update({ backgroundPosition: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#2d2d2d] text-gray-800 dark:text-[#e5e5e5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            >
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
