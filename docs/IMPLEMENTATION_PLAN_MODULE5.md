# Implementation Plan: MODULE 5 - Component System with Structured Categorization

## Overview

This document outlines the implementation plan for updating the component saving system to use the new JSON contract schema architecture with definitive style and tag lists.

## Goals

1. ✅ Replace free-text style/tag entry with dropdown/checkbox selection
2. ✅ Implement structured component categorization
3. ✅ Add smart navigation detection
4. ✅ Create input_props builder for quick edits
5. ✅ Ensure all components use predefined styles and tags

## Phase 1: Update SaveComponentDialog Component

### Step 1.1: Import New Constants and Types

```typescript
// Add to SaveComponentDialog.tsx imports
import { ComponentStyle, COMPONENT_STYLES, STYLE_METADATA } from '@/lib/constants/styles';
import { ComponentTag, ALL_TAGS, TAG_METADATA, getTagsByCategory } from '@/lib/constants/tags';
import { ComponentContract, InputProp } from '@/lib/types/contracts';
```

### Step 1.2: Update Form Schema

**Current Schema:**
```typescript
const componentSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum([...]),
  style: z.enum(['minimal', 'modern', ...]).optional(), // OLD: Limited styles
  tags: z.string().optional(), // OLD: Free text
  // ...
});
```

**New Schema:**
```typescript
const componentSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['header', 'footer', 'hero', 'section', 'button', 'form', 'navigation', 'custom']),
  style: z.enum(COMPONENT_STYLES as [string, ...string[]]), // NEW: All styles
  tags: z.array(z.enum(ALL_TAGS as [string, ...string[]])).default([]), // NEW: Array of tags
  description: z.string().max(500).optional(),
  html: z.string().min(1),
  input_props: z.record(z.any()).optional(), // NEW: Quick edit properties
});
```

### Step 1.3: Create Style Selector Component

**New File: `components/editor/StyleSelector.tsx`**

```typescript
interface StyleSelectorProps {
  value: ComponentStyle | undefined;
  onChange: (style: ComponentStyle) => void;
  disabled?: boolean;
}

export function StyleSelector({ value, onChange, disabled }: StyleSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select style (required)" />
      </SelectTrigger>
      <SelectContent>
        {COMPONENT_STYLES.map(style => (
          <SelectItem key={style} value={style}>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: STYLE_METADATA[style].primaryColor }}
              />
              {STYLE_METADATA[style].label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Step 1.4: Create Tag Selector Component

**New File: `components/editor/TagSelector.tsx`**

```typescript
interface TagSelectorProps {
  value: ComponentTag[];
  onChange: (tags: ComponentTag[]) => void;
  disabled?: boolean;
}

export function TagSelector({ value, onChange, disabled }: TagSelectorProps) {
  const categories = ['functional', 'navigation', 'style', 'industry'] as const;
  
  return (
    <div className="space-y-4">
      {categories.map(category => {
        const tags = getTagsByCategory(category);
        return (
          <div key={category}>
            <Label className="capitalize">{category} Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => {
                const isSelected = value.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onChange(value.filter(t => t !== tag));
                      } else {
                        onChange([...value, tag]);
                      }
                    }}
                    disabled={disabled}
                    className={cn(
                      "px-3 py-1 text-sm rounded-full border transition",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-accent"
                    )}
                  >
                    {TAG_METADATA[tag].icon && (
                      <span className="mr-1">{TAG_METADATA[tag].icon}</span>
                    )}
                    {TAG_METADATA[tag].label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Step 1.5: Create Smart Navigation Detector

**New File: `lib/utils/smart-navigation.ts`**

```typescript
import { SmartNavigationTag, isSmartNavigationTag } from '@/lib/constants/tags';

export function detectSmartNavigation(html: string): SmartNavigationTag[] {
  const detected: SmartNavigationTag[] = [];
  const lowerHtml = html.toLowerCase();
  
  // Pattern matching for common navigation patterns
  if (lowerHtml.includes('href="/"') || lowerHtml.includes('href="/home"')) {
    detected.push('smart_home');
  }
  if (lowerHtml.includes('href="/about"') || lowerHtml.includes('about')) {
    detected.push('smart_about');
  }
  if (lowerHtml.includes('href="/contact"') || lowerHtml.includes('contact')) {
    detected.push('smart_contact');
  }
  if (lowerHtml.includes('href="/services"') || lowerHtml.includes('services')) {
    detected.push('smart_services');
  }
  if (lowerHtml.includes('href="/shop"') || lowerHtml.includes('href="/store"')) {
    detected.push('smart_shop');
  }
  if (lowerHtml.includes('href="/blog"') || lowerHtml.includes('href="/news"')) {
    detected.push('smart_blog');
  }
  if (lowerHtml.includes('href="/portfolio"')) {
    detected.push('smart_portfolio');
  }
  if (lowerHtml.includes('href="http') || lowerHtml.includes('target="_blank"')) {
    detected.push('smart_external');
  }
  
  return [...new Set(detected)]; // Remove duplicates
}
```

### Step 1.6: Update SaveComponentDialog UI

**Replace style and tag inputs:**

```typescript
// OLD: Free text style input
<Select value={watch('style')} ...>
  <SelectItem value="minimal">Minimal</SelectItem>
  // Limited options
</Select>

// NEW: Style selector with all options
<div>
  <Label htmlFor="style">Style <span className="text-red-500">*</span></Label>
  <StyleSelector
    value={watch('style')}
    onChange={(style) => setValue('style', style)}
    disabled={isSubmitting}
  />
  {watch('style') && (
    <p className="text-xs text-gray-500 mt-1">
      {STYLE_METADATA[watch('style')].description}
    </p>
  )}
</div>

// OLD: Free text tags input
<Input {...register('tags')} placeholder="responsive, modern, dark" />

// NEW: Tag selector with checkboxes
<div>
  <Label>Tags</Label>
  <TagSelector
    value={watch('tags') || []}
    onChange={(tags) => setValue('tags', tags)}
    disabled={isSubmitting}
  />
</div>
```

### Step 1.7: Add Smart Navigation Auto-Detection

```typescript
// In SaveComponentDialog, after extracting HTML
useEffect(() => {
  if (!extractedHtml) return;
  
  // Auto-detect smart navigation tags
  const smartTags = detectSmartNavigation(extractedHtml);
  
  // Add to existing tags
  const currentTags = watch('tags') || [];
  const newTags = [...new Set([...currentTags, ...smartTags])];
  setValue('tags', newTags);
  
  // Show notification
  if (smartTags.length > 0) {
    toast({
      title: 'Smart navigation detected',
      description: `Found ${smartTags.length} navigation link(s)`,
    });
  }
}, [extractedHtml]);
```

## Phase 2: Update Database Schema

### Step 2.1: Create Migration Script

**File: `supabase/migrations/001_add_contract_fields.sql`**

```sql
-- Add new fields to site_components table
ALTER TABLE site_components
  ADD COLUMN IF NOT EXISTS style VARCHAR(50),
  ADD COLUMN IF NOT EXISTS type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS dependencies JSONB,
  ADD COLUMN IF NOT EXISTS slots JSONB,
  ADD COLUMN IF NOT EXISTS input_props JSONB,
  ADD COLUMN IF NOT EXISTS meta JSONB;

-- Add constraints
ALTER TABLE site_components
  ADD CONSTRAINT style_check CHECK (style IN (
    'modern_dark', 'modern_light', 'modern_gradient',
    'classic_white', 'classic_elegant',
    'minimal_dark', 'minimal_light',
    'corporate_blue', 'corporate_gray',
    'creative_colorful', 'creative_artistic',
    'vintage_retro', 'tech_neon',
    'medical_clean', 'restaurant_warm',
    'fashion_elegant', 'ecommerce_modern',
    'blog_readable', 'portfolio_showcase',
    'custom_authored'
  ));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_components_style ON site_components(style);
CREATE INDEX IF NOT EXISTS idx_components_tags ON site_components USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_components_type ON site_components(type);

-- Migrate existing data
UPDATE site_components
SET style = 'custom_authored'
WHERE style IS NULL;

UPDATE site_components
SET tags = ARRAY[]::TEXT[]
WHERE tags IS NULL;
```

### Step 2.2: Update Supabase Catalog Functions

**Update `lib/components/supabase-catalog.ts`:**

```typescript
// Update saveComponent function
export async function saveComponent(data: {
  name: string;
  category: Category;
  style: ComponentStyle; // NEW: Required, from enum
  type?: string;
  html: string;
  css?: string;
  js?: string;
  tags: ComponentTag[]; // NEW: Array of tags
  description?: string;
  thumbnail?: string;
  dependencies?: ComponentDependencies;
  slots?: ComponentSlot[];
  input_props?: Record<string, InputProp>;
  meta?: ComponentMeta;
  is_public?: boolean;
}): Promise<SupabaseComponent> {
  // Validate style and tags
  if (!COMPONENT_STYLES.includes(data.style)) {
    throw new Error(`Invalid style: ${data.style}`);
  }
  
  // Validate all tags
  for (const tag of data.tags) {
    if (!ALL_TAGS.includes(tag)) {
      throw new Error(`Invalid tag: ${tag}`);
    }
  }
  
  // Save to Supabase with new structure
  const { data: component, error } = await supabase
    .from('site_components')
    .insert([{
      name: data.name,
      category: data.category,
      style: data.style, // NEW
      type: data.type,
      html: data.html,
      css: data.css,
      js: data.js,
      tags: data.tags, // NEW: Array
      description: data.description,
      preview_img: data.thumbnail,
      dependencies: data.dependencies,
      slots: data.slots,
      input_props: data.input_props,
      meta: data.meta,
      is_public: data.is_public ?? false,
    }])
    .select()
    .single();
    
  // ... error handling
}
```

## Phase 3: Testing

### Step 3.1: Unit Tests

**File: `__tests__/components/SaveComponentDialog.test.tsx`**

```typescript
describe('SaveComponentDialog', () => {
  it('should only allow predefined styles', () => {
    // Test that style dropdown only shows valid styles
  });
  
  it('should only allow predefined tags', () => {
    // Test that tag selector only shows valid tags
  });
  
  it('should auto-detect smart navigation', () => {
    // Test smart navigation detection
  });
});
```

### Step 3.2: Integration Tests

```typescript
describe('Component Save Flow', () => {
  it('should save component with new contract structure', async () => {
    // Test full save flow
  });
  
  it('should validate style and tags on save', async () => {
    // Test validation
  });
});
```

## Phase 4: Migration of Existing Components

### Step 4.1: Migration Script

**File: `scripts/migrate-components.ts`**

```typescript
// Migrate existing components to new structure
async function migrateComponents() {
  const { data: components } = await supabase
    .from('site_components')
    .select('*');
    
  for (const component of components) {
    // Map old style to new style
    const newStyle = mapOldStyleToNew(component.style);
    
    // Extract tags from description/name
    const tags = extractTags(component);
    
    // Update component
    await supabase
      .from('site_components')
      .update({
        style: newStyle,
        tags: tags,
      })
      .eq('id', component.id);
  }
}
```

## Phase 5: Documentation

### Step 5.1: Update Component Save Documentation

- Document new style/tag system
- Provide examples
- Create migration guide

## Timeline

- **Week 1**: Phase 1 (UI Updates)
- **Week 2**: Phase 2 (Database Migration)
- **Week 3**: Phase 3 (Testing)
- **Week 4**: Phase 4 (Data Migration) + Documentation

## Success Criteria

✅ All components use predefined styles only
✅ All components use predefined tags only
✅ Smart navigation auto-detection works
✅ Database schema supports new structure
✅ Existing components migrated successfully
✅ No breaking changes to existing functionality

