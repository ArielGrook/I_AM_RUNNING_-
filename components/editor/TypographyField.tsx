/**
 * Advanced typography field for Puck: font size, weight, line height, letter spacing, color, alignment.
 */

'use client';

import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

export interface TypographyValue {
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
];

interface TypographyFieldProps {
  value?: TypographyValue | null;
  onChange: (v: TypographyValue) => void;
  className?: string;
}

export function TypographyField({ value, onChange, className }: TypographyFieldProps) {
  const fontSize = value?.fontSize ?? 16;
  const fontWeight = value?.fontWeight ?? '400';
  const lineHeight = value?.lineHeight ?? 1.5;
  const letterSpacing = value?.letterSpacing ?? 0;
  const color = value?.color ?? '#000000';
  const textAlign = value?.textAlign ?? 'left';

  const update = useCallback(
    (patch: Partial<TypographyValue>) => {
      onChange({
        fontSize,
        fontWeight,
        lineHeight,
        letterSpacing,
        color,
        textAlign,
        ...patch,
      });
    },
    [onChange, fontSize, fontWeight, lineHeight, letterSpacing, color, textAlign]
  );

  return (
    <div className={cn('typography-field space-y-4', className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Font size</Label>
          <span className="text-xs text-gray-500 font-mono">{fontSize}px</span>
        </div>
        <Slider
          value={[fontSize]}
          onValueChange={([v]) => update({ fontSize: v })}
          min={10}
          max={72}
          step={1}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Font weight</Label>
        <select
          value={fontWeight}
          onChange={(e) => update({ fontWeight: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#2d2d2d] text-gray-800 dark:text-[#e5e5e5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
        >
          {FONT_WEIGHTS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Line height</Label>
          <span className="text-xs text-gray-500 font-mono">{lineHeight}</span>
        </div>
        <Slider
          value={[lineHeight]}
          onValueChange={([v]) => update({ lineHeight: v })}
          min={0.8}
          max={3}
          step={0.1}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Letter spacing (px)</Label>
          <span className="text-xs text-gray-500 font-mono">{letterSpacing}</span>
        </div>
        <Slider
          value={[letterSpacing]}
          onValueChange={([v]) => update({ letterSpacing: v })}
          min={-2}
          max={10}
          step={0.5}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Text color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border border-[#e5e5e5] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#2d2d2d]"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => update({ color: e.target.value })}
            className="flex-1 px-2 py-1.5 text-xs font-mono border border-[#e5e5e5] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#2d2d2d] text-gray-800 dark:text-[#e5e5e5] rounded focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Alignment</Label>
        <div className="flex gap-1">
          {(
            [
              { value: 'left' as const, Icon: AlignLeft },
              { value: 'center' as const, Icon: AlignCenter },
              { value: 'right' as const, Icon: AlignRight },
              { value: 'justify' as const, Icon: AlignJustify },
            ] as const
          ).map(({ value: align, Icon }) => (
            <button
              key={align}
              type="button"
              onClick={() => update({ textAlign: align })}
              className={cn(
                'flex-1 flex items-center justify-center p-2 rounded border transition-all',
                textAlign === align
                  ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                  : 'bg-[#f5f5f5] dark:bg-[#2d2d2d] text-gray-700 dark:text-[#e5e5e5] border-[#e5e5e5] dark:border-[#4a4a4a] hover:border-[#FF6B35]'
              )}
              title={align}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
