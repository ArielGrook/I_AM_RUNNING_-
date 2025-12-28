/**
 * Advanced Gradient Builder Component
 * 
 * Provides a sophisticated interface for creating CSS gradients:
 * - Linear, Radial, and Conic gradient types
 * - Multiple color stops with position control
 * - Real-time preview
 * - Preset gradient library
 * - Copy CSS functionality
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ColorStop {
  id: string;
  color: string;
  position: number;
  opacity: number;
}

interface GradientBuilderProps {
  value?: string;
  onChange: (gradient: string) => void;
  className?: string;
}

type GradientType = 'linear' | 'radial' | 'conic';

// Preset gradients library
const PRESET_GRADIENTS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd700 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #00c6fb 0%, #005bea 50%, #a855f7 100%)' },
  { name: 'Peach', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Lavender', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: 'Berry', value: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)' },
  { name: 'Lime', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Rose', value: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)' },
  { name: 'Steel', value: 'linear-gradient(135deg, #485563 0%, #29323c 100%)' },
];

const DIRECTION_PRESETS = [
  { label: '→', value: 90, title: 'Left to Right' },
  { label: '↓', value: 180, title: 'Top to Bottom' },
  { label: '←', value: 270, title: 'Right to Left' },
  { label: '↑', value: 0, title: 'Bottom to Top' },
  { label: '↘', value: 135, title: 'Diagonal' },
  { label: '↗', value: 45, title: 'Diagonal Up' },
];

const RADIAL_POSITIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Top Left', value: 'top left' },
  { label: 'Top Right', value: 'top right' },
];

export function GradientBuilder({ value, onChange, className }: GradientBuilderProps) {
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [radialPosition, setRadialPosition] = useState('center');
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: '1', color: '#ff6b35', position: 0, opacity: 1 },
    { id: '2', color: '#f7931e', position: 100, opacity: 1 },
  ]);
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Generate CSS gradient string
  const gradientCSS = useMemo(() => {
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops
      .map(stop => {
        const rgba = hexToRgba(stop.color, stop.opacity);
        return `${rgba} ${stop.position}%`;
      })
      .join(', ');

    switch (type) {
      case 'linear':
        return `linear-gradient(${angle}deg, ${stopsString})`;
      case 'radial':
        return `radial-gradient(circle at ${radialPosition}, ${stopsString})`;
      case 'conic':
        return `conic-gradient(from ${angle}deg at ${radialPosition}, ${stopsString})`;
      default:
        return '';
    }
  }, [type, angle, radialPosition, colorStops]);

  // Update parent when gradient changes
  const applyGradient = useCallback(() => {
    onChange(gradientCSS);
  }, [gradientCSS, onChange]);

  // Add new color stop
  const addColorStop = () => {
    const newPosition = colorStops.length > 0 
      ? Math.min(colorStops[colorStops.length - 1].position + 20, 100)
      : 50;
    
    setColorStops(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        color: '#888888',
        position: newPosition,
        opacity: 1,
      }
    ]);
  };

  // Remove color stop
  const removeColorStop = (id: string) => {
    if (colorStops.length <= 2) return; // Keep minimum 2 stops
    setColorStops(prev => prev.filter(stop => stop.id !== id));
  };

  // Update color stop
  const updateColorStop = (id: string, updates: Partial<ColorStop>) => {
    setColorStops(prev => prev.map(stop => 
      stop.id === id ? { ...stop, ...updates } : stop
    ));
  };

  // Copy gradient CSS
  const copyGradient = async () => {
    try {
      await navigator.clipboard.writeText(gradientCSS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Apply preset gradient
  const applyPreset = (presetValue: string) => {
    // Parse preset and update state
    onChange(presetValue);
    setShowPresets(false);
  };

  // Reset to default
  const resetGradient = () => {
    setType('linear');
    setAngle(135);
    setColorStops([
      { id: '1', color: '#ff6b35', position: 0, opacity: 1 },
      { id: '2', color: '#f7931e', position: 100, opacity: 1 },
    ]);
  };

  return (
    <div className={cn("gradient-builder space-y-4", className)}>
      {/* Live Preview */}
      <div 
        className="w-full h-24 rounded-lg border border-gray-200 shadow-inner"
        style={{ background: gradientCSS }}
      />

      {/* Gradient Type Selector */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">Gradient Type</Label>
        <div className="flex gap-1">
          {(['linear', 'radial', 'conic'] as GradientType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-medium rounded border transition-all capitalize",
                type === t
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Direction/Position Controls */}
      {type === 'linear' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-600">Direction</Label>
            <span className="text-xs text-gray-500 font-mono">{angle}°</span>
          </div>
          <Slider
            value={[angle]}
            onValueChange={([v]) => setAngle(v)}
            max={360}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex gap-1 flex-wrap">
            {DIRECTION_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => setAngle(preset.value)}
                title={preset.title}
                className={cn(
                  "w-8 h-8 text-sm rounded border transition-all",
                  angle === preset.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(type === 'radial' || type === 'conic') && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Position</Label>
          <div className="grid grid-cols-4 gap-1">
            {RADIAL_POSITIONS.map(pos => (
              <button
                key={pos.value}
                onClick={() => setRadialPosition(pos.value)}
                className={cn(
                  "px-2 py-1.5 text-xs rounded border transition-all",
                  radialPosition === pos.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {pos.label}
              </button>
            ))}
          </div>
          {type === 'conic' && (
            <>
              <div className="flex items-center justify-between mt-3">
                <Label className="text-xs text-gray-600">Start Angle</Label>
                <span className="text-xs text-gray-500 font-mono">{angle}°</span>
              </div>
              <Slider
                value={[angle]}
                onValueChange={([v]) => setAngle(v)}
                max={360}
                min={0}
                step={1}
                className="w-full"
              />
            </>
          )}
        </div>
      )}

      {/* Color Stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-600">Color Stops</Label>
          <button
            onClick={addColorStop}
            className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {colorStops.map((stop, index) => (
            <div key={stop.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateColorStop(stop.id, { color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={stop.color}
                    onChange={(e) => updateColorStop(stop.id, { color: e.target.value })}
                    className="w-20 px-2 py-1 text-xs font-mono border border-gray-200 rounded"
                  />
                  <span className="text-xs text-gray-400">{stop.position}%</span>
                </div>
                <Slider
                  value={[stop.position]}
                  onValueChange={([v]) => updateColorStop(stop.id, { position: v })}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Slider
                  value={[stop.opacity * 100]}
                  onValueChange={([v]) => updateColorStop(stop.id, { opacity: v / 100 })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-12"
                  orientation="vertical"
                />
                {colorStops.length > 2 && (
                  <button
                    onClick={() => removeColorStop(stop.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preset Gradients */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 text-xs text-gray-600 hover:text-orange-600 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          {showPresets ? 'Hide Presets' : 'Show Presets'}
        </button>
        
        {showPresets && (
          <div className="grid grid-cols-4 gap-2">
            {PRESET_GRADIENTS.map((preset, i) => (
              <button
                key={i}
                onClick={() => applyPreset(preset.value)}
                className="group relative"
                title={preset.name}
              >
                <div 
                  className="w-full h-8 rounded border border-gray-200 hover:border-orange-400 transition-all hover:scale-105"
                  style={{ background: preset.value }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={applyGradient}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
        >
          Apply Gradient
        </button>
        <button
          onClick={copyGradient}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors flex items-center gap-1"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={resetGradient}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* CSS Output */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">CSS Output</Label>
        <div className="p-2 bg-gray-900 rounded-lg overflow-x-auto">
          <code className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            background: {gradientCSS};
          </code>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  if (opacity === 1) {
    return hex;
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

