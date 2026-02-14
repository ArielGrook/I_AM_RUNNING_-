/**
 * Modern Style Manager Component
 * 
 * Provides a clean, intuitive interface for editing component styles
 * with range sliders, color pickers, and gradient builders.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  Palette, 
  Square, 
  Type, 
  Box, 
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  ChevronDown,
  ChevronUp,
  Blend,
  Image as ImageIcon,
} from 'lucide-react';
import { GradientBuilder } from './GradientBuilder';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface StyleManagerProps {
  editor: any; // GrapesJS Editor instance
  className?: string;
}

interface StyleSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  '#ff6b35', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
  '#000000', '#ffffff', '#1f2937', '#f3f4f6', '#fef3c7',
];

export function StyleManager({ editor, className }: StyleManagerProps) {
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [bgError, setBgError] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [sections, setSections] = useState<StyleSection[]>([
    { id: 'dimensions', title: 'Dimensions', icon: <Maximize2 className="w-4 h-4" />, expanded: true },
    { id: 'spacing', title: 'Spacing', icon: <Box className="w-4 h-4" />, expanded: false },
    { id: 'colors', title: 'Colors & Background', icon: <Palette className="w-4 h-4" />, expanded: true },
    { id: 'gradient', title: 'Gradient Builder', icon: <Blend className="w-4 h-4" />, expanded: false },
    { id: 'backgroundImage', title: 'Background Image', icon: <ImageIcon className="w-4 h-4" />, expanded: false },
    { id: 'typography', title: 'Typography', icon: <Type className="w-4 h-4" />, expanded: false },
    { id: 'borders', title: 'Borders & Radius', icon: <Square className="w-4 h-4" />, expanded: false },
  ]);

  const getCurrentBackgroundImageUrl = useCallback((): string => {
    const val = styles['background-image'] || '';
    const match = val.match(/url\((['"]?)(.*?)\1\)/i);
    return match?.[2]?.trim() || '';
  }, [styles]);

  // Update style on the selected component
  // IMPORTANT: declared before callbacks that depend on it (avoids TDZ runtime errors)
  const updateStyle = useCallback((property: string, value: string) => {
    if (!selectedComponent) return;
    
    selectedComponent.addStyle({ [property]: value });
    setStyles(prev => ({ ...prev, [property]: value }));
  }, [selectedComponent]);

  const applyBackgroundImage = useCallback((imageUrl: string) => {
    const url = imageUrl.trim();
    if (!url) return;
    updateStyle('background-image', `url("${url}")`);
    // Keep existing values if already set, otherwise apply safe defaults
    if (!styles['background-size']) updateStyle('background-size', 'cover');
    if (!styles['background-position']) updateStyle('background-position', 'center');
    if (!styles['background-repeat']) updateStyle('background-repeat', 'no-repeat');
    if (!styles['background-attachment']) updateStyle('background-attachment', 'scroll');
  }, [styles, updateStyle]);

  const removeBackgroundImage = useCallback(() => {
    updateStyle('background-image', 'none');
  }, [updateStyle]);

  // Listen for component selection changes
  useEffect(() => {
    if (!editor) return;

    const handleSelect = () => {
      const selected = editor.getSelected();
      setSelectedComponent(selected);
      
      if (selected) {
        const computedStyle = selected.getStyle();
        setStyles(computedStyle || {});
      } else {
        setStyles({});
      }
    };

    editor.on('component:selected', handleSelect);
    editor.on('component:deselected', () => {
      setSelectedComponent(null);
      setStyles({});
    });
    editor.on('component:styleUpdate', handleSelect);

    return () => {
      editor.off('component:selected', handleSelect);
      editor.off('component:deselected');
      editor.off('component:styleUpdate', handleSelect);
    };
  }, [editor]);

  // Sync bg URL input with selected component background image
  useEffect(() => {
    const current = getCurrentBackgroundImageUrl();
    setBgUrlInput(current);
    setBgError(null);
  }, [getCurrentBackgroundImageUrl, selectedComponent]);

  // Parse numeric value from style string
  const parseNumericValue = (value: string | undefined, defaultVal: number = 0): number => {
    if (!value) return defaultVal;
    const num = parseFloat(value);
    return isNaN(num) ? defaultVal : num;
  };

  // Toggle section expanded state
  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));
  };

  if (!selectedComponent) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>
        <Box className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">Select an element to edit its styles</p>
      </div>
    );
  }

  const currentBgUrl = getCurrentBackgroundImageUrl();

  return (
    <div className={cn("style-manager overflow-y-auto", className)}>
      {sections.map(section => (
        <div key={section.id} className="border-b border-gray-100 last:border-b-0">
          {/* Section Header */}
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-700">
              {section.icon}
              <span className="font-medium text-sm">{section.title}</span>
            </div>
            {section.expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Section Content */}
          {section.expanded && (
            <div className="px-4 pb-4 space-y-4">
              {/* DIMENSIONS SECTION */}
              {section.id === 'dimensions' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Width</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles.width || 'auto'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles.width, 100)]}
                      onValueChange={([v]) => updateStyle('width', `${v}%`)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Height</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles.height || 'auto'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles.height, 0)]}
                      onValueChange={([v]) => updateStyle('height', v > 0 ? `${v}px` : 'auto')}
                      max={500}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Max Width</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles['max-width'] || 'none'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles['max-width'], 100)]}
                      onValueChange={([v]) => updateStyle('max-width', `${v}%`)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* SPACING SECTION */}
              {section.id === 'spacing' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Padding</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles.padding || '0px'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles.padding, 0)]}
                      onValueChange={([v]) => updateStyle('padding', `${v}px`)}
                      max={100}
                      min={0}
                      step={2}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Margin</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles.margin || '0px'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles.margin, 0)]}
                      onValueChange={([v]) => updateStyle('margin', `${v}px`)}
                      max={100}
                      min={0}
                      step={2}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Padding Top</Label>
                      <Slider
                        value={[parseNumericValue(styles['padding-top'], 0)]}
                        onValueChange={([v]) => updateStyle('padding-top', `${v}px`)}
                        max={100}
                        min={0}
                        step={2}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Padding Bottom</Label>
                      <Slider
                        value={[parseNumericValue(styles['padding-bottom'], 0)]}
                        onValueChange={([v]) => updateStyle('padding-bottom', `${v}px`)}
                        max={100}
                        min={0}
                        step={2}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TYPOGRAPHY SECTION */}
              {section.id === 'typography' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Font Size</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles['font-size'] || '16px'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles['font-size'], 16)]}
                      onValueChange={([v]) => updateStyle('font-size', `${v}px`)}
                      max={72}
                      min={8}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Font Weight</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles['font-weight'] || '400'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles['font-weight'], 400)]}
                      onValueChange={([v]) => updateStyle('font-weight', `${v}`)}
                      max={900}
                      min={100}
                      step={100}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Line Height</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles['line-height'] || '1.5'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles['line-height'], 1.5) * 10]}
                      onValueChange={([v]) => updateStyle('line-height', `${v / 10}`)}
                      max={30}
                      min={10}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Text Align</Label>
                    <div className="flex gap-1">
                      {[
                        { value: 'left', icon: <AlignLeft className="w-4 h-4" /> },
                        { value: 'center', icon: <AlignCenter className="w-4 h-4" /> },
                        { value: 'right', icon: <AlignRight className="w-4 h-4" /> },
                      ].map(({ value, icon }) => (
                        <button
                          key={value}
                          onClick={() => updateStyle('text-align', value)}
                          className={cn(
                            "flex-1 p-2 rounded border transition-colors",
                            styles['text-align'] === value
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* COLORS SECTION */}
              {section.id === 'colors' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Text Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={styles.color || '#000000'}
                        onChange={(e) => updateStyle('color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={styles.color || '#000000'}
                        onChange={(e) => updateStyle('color', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded font-mono"
                        placeholder="#000000"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.slice(0, 10).map(color => (
                        <button
                          key={color}
                          onClick={() => updateStyle('color', color)}
                          className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Background Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={styles['background-color'] || '#ffffff'}
                        onChange={(e) => updateStyle('background-color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={styles['background-color'] || ''}
                        onChange={(e) => updateStyle('background-color', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded font-mono"
                        placeholder="transparent"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => updateStyle('background-color', color)}
                          className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Opacity</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {Math.round(parseNumericValue(styles.opacity, 1) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles.opacity, 1) * 100]}
                      onValueChange={([v]) => updateStyle('opacity', `${v / 100}`)}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* GRADIENT SECTION */}
              {section.id === 'gradient' && (
                <GradientBuilder
                  value={styles.background || styles['background-image'] || ''}
                  onChange={(gradient) => updateStyle('background', gradient)}
                />
              )}

              {/* BACKGROUND IMAGE SECTION */}
              {section.id === 'backgroundImage' && (
                <div className="space-y-4">
                  {/* Preview */}
                  {currentBgUrl ? (
                    <div className="space-y-2">
                      <div
                        className="w-full h-24 rounded border border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#2d2d2d] overflow-hidden"
                        style={{
                          backgroundImage: `url("${currentBgUrl}")`,
                          backgroundSize: (styles['background-size'] as any) || 'cover',
                          backgroundPosition: (styles['background-position'] as any) || 'center',
                          backgroundRepeat: (styles['background-repeat'] as any) || 'no-repeat',
                          backgroundAttachment: (styles['background-attachment'] as any) || 'scroll',
                        }}
                        title={currentBgUrl}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                          {currentBgUrl}
                        </span>
                        <button
                          type="button"
                          onClick={removeBackgroundImage}
                          className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-[#404040] text-gray-600 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      No background image applied.
                    </div>
                  )}

                  {/* Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 dark:text-gray-300">Upload</Label>
                    <div className="flex items-center gap-2">
                      <label
                        className={cn(
                          "inline-flex items-center justify-center px-3 py-2 text-sm rounded border transition-colors cursor-pointer",
                          "border-gray-200 dark:border-[#404040] bg-white dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-200",
                          "hover:border-[#FF6B35] hover:text-[#FF6B35]"
                        )}
                      >
                        {isUploadingBg ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingBg}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setBgError(null);
                            setIsUploadingBg(true);
                            try {
                              const supabase = createClientComponentClient();
                              const safeName = file.name.replace(/[^\w.-]+/g, '_');
                              const id = (globalThis.crypto as any)?.randomUUID?.() || `${Date.now()}`;
                              const path = `backgrounds/${id}-${safeName}`;

                              const { error: uploadError } = await supabase.storage
                                .from('project-assets')
                                .upload(path, file, {
                                  cacheControl: '3600',
                                  upsert: true,
                                  contentType: file.type,
                                });

                              if (uploadError) throw uploadError;

                              const { data } = supabase.storage
                                .from('project-assets')
                                .getPublicUrl(path);

                              const publicUrl = data?.publicUrl;
                              if (!publicUrl) throw new Error('Failed to get public URL for uploaded image');

                              applyBackgroundImage(publicUrl);
                              setBgUrlInput(publicUrl);
                            } catch (err) {
                              const msg = err instanceof Error ? err.message : String(err);
                              setBgError(msg);
                            } finally {
                              setIsUploadingBg(false);
                              // allow re-uploading same file
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 dark:text-gray-300">Image URL</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={bgUrlInput}
                        onChange={(e) => setBgUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-2 py-2 text-sm border border-gray-200 dark:border-[#404040] rounded bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBgError(null);
                          const url = bgUrlInput.trim();
                          if (!/^https?:\/\//i.test(url)) {
                            setBgError('URL must start with http:// or https://');
                            return;
                          }
                          applyBackgroundImage(url);
                        }}
                        className="px-3 py-2 text-sm rounded border border-gray-200 dark:border-[#404040] bg-white dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {bgError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{bgError}</p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 dark:text-gray-300">Size</Label>
                      <select
                        value={styles['background-size'] || 'cover'}
                        onChange={(e) => updateStyle('background-size', e.target.value)}
                        className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-[#404040] rounded bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      >
                        <option value="cover">cover</option>
                        <option value="contain">contain</option>
                        <option value="auto">auto</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 dark:text-gray-300">Position</Label>
                      <select
                        value={styles['background-position'] || 'center'}
                        onChange={(e) => updateStyle('background-position', e.target.value)}
                        className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-[#404040] rounded bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      >
                        <option value="center">center</option>
                        <option value="top">top</option>
                        <option value="bottom">bottom</option>
                        <option value="left">left</option>
                        <option value="right">right</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 dark:text-gray-300">Repeat</Label>
                      <select
                        value={styles['background-repeat'] || 'no-repeat'}
                        onChange={(e) => updateStyle('background-repeat', e.target.value)}
                        className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-[#404040] rounded bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      >
                        <option value="no-repeat">no-repeat</option>
                        <option value="repeat">repeat</option>
                        <option value="repeat-x">repeat-x</option>
                        <option value="repeat-y">repeat-y</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 dark:text-gray-300">Attachment</Label>
                      <select
                        value={styles['background-attachment'] || 'scroll'}
                        onChange={(e) => updateStyle('background-attachment', e.target.value)}
                        className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-[#404040] rounded bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      >
                        <option value="scroll">scroll</option>
                        <option value="fixed">fixed</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* BORDERS SECTION */}
              {section.id === 'borders' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Border Radius</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles['border-radius'] || '0px'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles['border-radius'], 0)]}
                      onValueChange={([v]) => updateStyle('border-radius', `${v}px`)}
                      max={50}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Border Width</Label>
                      <span className="text-xs text-gray-500 font-mono">
                        {styles['border-width'] || '0px'}
                      </span>
                    </div>
                    <Slider
                      value={[parseNumericValue(styles['border-width'], 0)]}
                      onValueChange={([v]) => updateStyle('border-width', `${v}px`)}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Border Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={styles['border-color'] || '#e5e7eb'}
                        onChange={(e) => updateStyle('border-color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={styles['border-color'] || '#e5e7eb'}
                        onChange={(e) => updateStyle('border-color', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded font-mono"
                        placeholder="#e5e7eb"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Border Style</Label>
                    <div className="flex gap-1">
                      {['none', 'solid', 'dashed', 'dotted'].map(style => (
                        <button
                          key={style}
                          onClick={() => {
                            updateStyle('border-style', style);
                            if (style !== 'none' && !styles['border-width']) {
                              updateStyle('border-width', '1px');
                            }
                          }}
                          className={cn(
                            "flex-1 px-2 py-1.5 text-xs rounded border transition-colors capitalize",
                            styles['border-style'] === style
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          )}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

