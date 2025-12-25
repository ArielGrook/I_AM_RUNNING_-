/**
 * Style Selector Component
 * 
 * Dropdown selector for component styles with visual previews.
 * Enforces selection from predefined style list only.
 */

'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ComponentStyle, COMPONENT_STYLES, STYLE_METADATA } from '@/lib/constants/styles';
import { cn } from '@/lib/utils';

interface StyleSelectorProps {
  value: ComponentStyle | undefined;
  onChange: (style: ComponentStyle) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

/**
 * Group styles by type for better organization
 */
const STYLE_GROUPS = {
  Modern: ['modern_dark', 'modern_light', 'modern_gradient'] as ComponentStyle[],
  Classic: ['classic_white', 'classic_elegant'] as ComponentStyle[],
  Minimal: ['minimal_dark', 'minimal_light'] as ComponentStyle[],
  Corporate: ['corporate_blue', 'corporate_gray'] as ComponentStyle[],
  Creative: ['creative_colorful', 'creative_artistic'] as ComponentStyle[],
  Specialized: [
    'vintage_retro',
    'tech_neon',
    'medical_clean',
    'restaurant_warm',
    'fashion_elegant',
    'ecommerce_modern',
    'blog_readable',
    'portfolio_showcase',
  ] as ComponentStyle[],
  Custom: ['custom_authored'] as ComponentStyle[],
} as const;

export function StyleSelector({
  value,
  onChange,
  disabled = false,
  required = true,
  error,
  className,
}: StyleSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="style">
        Style {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={value || ''}
        onValueChange={(val) => {
          if (val && COMPONENT_STYLES.includes(val as ComponentStyle)) {
            onChange(val as ComponentStyle);
          }
        }}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id="style" className={cn(error && 'border-red-500')}>
          <SelectValue placeholder={required ? 'Select style (required)' : 'Select style'}>
            {value && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: STYLE_METADATA[value].primaryColor }}
                  title={STYLE_METADATA[value].description}
                />
                <span>{STYLE_METADATA[value].label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {Object.entries(STYLE_GROUPS).map(([groupName, styles]) => (
            <div key={groupName}>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {groupName}
              </div>
              {styles.map((style) => {
                const metadata = STYLE_METADATA[style];
                return (
                  <SelectItem
                    key={style}
                    value={style}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 py-1">
                      <div
                        className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: metadata.primaryColor }}
                        title={metadata.description}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{metadata.label}</div>
                        <div className="text-xs text-gray-500">{metadata.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {value && !error && (
        <p className="text-xs text-gray-500">
          {STYLE_METADATA[value].description}
        </p>
      )}
    </div>
  );
}


