'use client';

import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

export interface AnimationValue {
  type?: string;
  delay?: number;
  duration?: number;
}

const ANIMATION_TYPES = [
  { value: '', label: 'None' },
  { value: 'fade-up', label: 'Fade up' },
  { value: 'fade-down', label: 'Fade down' },
  { value: 'fade-in', label: 'Fade in' },
  { value: 'zoom-in', label: 'Zoom in' },
  { value: 'zoom-out', label: 'Zoom out' },
  { value: 'slide-left', label: 'Slide left' },
  { value: 'slide-right', label: 'Slide right' },
];

interface AnimationControlsProps {
  value?: AnimationValue | null;
  onChange: (v: AnimationValue) => void;
  className?: string;
}

export function AnimationControls({ value, onChange, className }: AnimationControlsProps) {
  const type = value?.type ?? '';
  const delay = value?.delay ?? 0;
  const duration = value?.duration ?? 500;

  const update = useCallback(
    (patch: Partial<AnimationValue>) => {
      onChange({ type, delay, duration, ...patch });
    },
    [onChange, type, delay, duration]
  );

  const handlePreview = useCallback(() => {
    const el = document.querySelector('[data-puck-animation-preview="true"]');
    if (!el) return;
    el.removeAttribute('data-puck-animation-preview');
    void (el as HTMLElement).offsetHeight;
    el.setAttribute('data-puck-animation-preview', 'true');
    const anim = (el as HTMLElement).getAnimations?.()?.[0];
    if (anim) {
      anim.cancel();
      anim.play();
    }
  }, []);

  return (
    <div className={cn('animation-controls space-y-4', className)}>
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Animation type</Label>
        <select
          value={type}
          onChange={(e) => update({ type: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#2d2d2d] text-gray-800 dark:text-[#e5e5e5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
        >
          {ANIMATION_TYPES.map((opt) => (
            <option key={opt.value || 'none'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Delay (ms)</Label>
          <span className="text-xs text-gray-500 font-mono">{delay}</span>
        </div>
        <Slider value={[delay]} onValueChange={([v]) => update({ delay: v })} min={0} max={2000} step={50} className="w-full" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-600 dark:text-[#e5e5e5]">Duration (ms)</Label>
          <span className="text-xs text-gray-500 font-mono">{duration}</span>
        </div>
        <Slider value={[duration]} onValueChange={([v]) => update({ duration: v })} min={200} max={2000} step={50} className="w-full" />
      </div>
      <button
        type="button"
        onClick={handlePreview}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-[#e5e5e5] border border-[#e5e5e5] dark:border-[#4a4a4a] bg-[#f5f5f5] dark:bg-[#2d2d2d] hover:border-[#FF6B35] rounded-lg transition-colors"
        title="Preview animation"
      >
        <Play className="w-4 h-4" />
        Preview
      </button>
    </div>
  );
}
