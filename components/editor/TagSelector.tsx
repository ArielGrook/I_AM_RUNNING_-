/**
 * Tag Selector Component
 * 
 * Multi-select interface for component tags with category grouping.
 * Enforces selection from predefined tag list only.
 */

'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ComponentTag, ALL_TAGS, TAG_METADATA, getTagsByCategory } from '@/lib/constants/tags';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TagSelectorProps {
  value: ComponentTag[];
  onChange: (tags: ComponentTag[]) => void;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
}

const MAX_TAGS_DEFAULT = 10;

export function TagSelector({
  value = [],
  onChange,
  disabled = false,
  maxTags = MAX_TAGS_DEFAULT,
  className,
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['functional', 'navigation', 'style', 'industry'] as const;
  
  // Filter tags by search query
  const filteredTags = searchQuery
    ? ALL_TAGS.filter(tag =>
        TAG_METADATA[tag].label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        TAG_METADATA[tag].description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_TAGS;
  
  const handleTagToggle = (tag: ComponentTag) => {
    if (disabled) return;
    
    const isSelected = value.includes(tag);
    
    if (isSelected) {
      // Remove tag
      onChange(value.filter(t => t !== tag));
    } else {
      // Add tag (check max limit)
      if (value.length >= maxTags) {
        // Show warning or prevent
        return;
      }
      onChange([...value, tag]);
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            Tags
            <span className="text-xs text-gray-500 ml-2">
              ({value.length}/{maxTags} selected)
            </span>
          </Label>
        </div>
        
        {/* Search input */}
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      
      {/* Tag selection by category */}
      <ScrollArea className="h-[400px] border rounded-md p-4">
        {searchQuery ? (
          // Show filtered results
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Search Results ({filteredTags.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => {
                const isSelected = value.includes(tag);
                const metadata = TAG_METADATA[tag];
                const isDisabled = disabled || (!isSelected && value.length >= maxTags);
                
                return (
                  <label
                    key={tag}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-accent',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleTagToggle(tag)}
                      disabled={isDisabled}
                      className="data-[state=checked]:bg-primary-foreground data-[state=checked]:border-primary-foreground"
                    />
                    {metadata.icon && <span>{metadata.icon}</span>}
                    <span className="text-sm font-medium">{metadata.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          // Show by category
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryTags = getTagsByCategory(category).filter(tag =>
                !searchQuery || filteredTags.includes(tag)
              );
              
              if (categoryTags.length === 0) return null;
              
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 capitalize">
                      {category} Tags
                    </h4>
                    <span className="text-xs text-gray-500">
                      {categoryTags.filter(t => value.includes(t)).length}/{categoryTags.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map((tag) => {
                      const isSelected = value.includes(tag);
                      const metadata = TAG_METADATA[tag];
                      const isDisabled = disabled || (!isSelected && value.length >= maxTags);
                      
                      return (
                        <label
                          key={tag}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-accent hover:border-accent',
                            isDisabled && 'opacity-50 cursor-not-allowed'
                          )}
                          title={metadata.description}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleTagToggle(tag)}
                            disabled={isDisabled}
                            className="w-4 h-4 data-[state=checked]:bg-primary-foreground data-[state=checked]:border-primary-foreground"
                          />
                          {metadata.icon && <span className="text-xs">{metadata.icon}</span>}
                          <span className="font-medium">{metadata.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      
      {value.length >= maxTags && (
        <p className="text-xs text-amber-600">
          Maximum {maxTags} tags reached. Remove a tag to add another.
        </p>
      )}
    </div>
  );
}

