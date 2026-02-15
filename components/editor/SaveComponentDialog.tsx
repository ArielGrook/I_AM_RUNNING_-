/**
 * Save Component Dialog
 * 
 * Modal dialog for saving components to Supabase.
 * 
 * Stage 2 Module 5: Component System from Supabase
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category } from '@/lib/types/project';
import { ComponentStyle } from '@/lib/constants/styles';
import { ComponentTag } from '@/lib/constants/tags';
import { saveComponent } from '@/lib/components/supabase-catalog';
import { useToast } from '@/components/ui/use-toast';
/** Minimal editor ref for save-component (Puck migration: no longer GrapesJS) */
export type EditorRefForSave = {
  getEditor: () => { getSelected: () => unknown; getWrapper: () => unknown; getHtml?: () => string; getCss?: () => string } | null;
};
import { StyleSelector } from './StyleSelector';
import { TagSelector } from './TagSelector';
import { detectSmartNavigation } from '@/lib/utils/smart-navigation';
import { ComponentSaveFormSchema, type ComponentSaveFormData } from '@/lib/schemas/validation';

const componentSchema = ComponentSaveFormSchema;

type ComponentFormData = ComponentSaveFormData;

type SelectorSets = {
  classes: Set<string>;
  ids: Set<string>;
  tags: Set<string>;
};

const GLOBAL_TAGS = new Set(['html', 'body', '*']);

function extractSelectorsFromHtml(html: string): SelectorSets {
  const classes = new Set<string>();
  const ids = new Set<string>();
  const tags = new Set<string>();

  if (typeof window === 'undefined' || !html.trim()) {
    return { classes, ids, tags };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.body?.querySelectorAll('*') ?? []);

    elements.forEach((el) => {
      el.classList.forEach((className) => classes.add(className));
      if (el.id) {
        ids.add(el.id);
      }
      const tagName = el.tagName?.toLowerCase();
      if (tagName) {
        tags.add(tagName);
      }
    });
  } catch {
    // If parsing fails, fall back to empty selector sets
  }

  return { classes, ids, tags };
}

function selectorMatchesSets(selectorText: string, sets: SelectorSets): boolean {
  if (!selectorText.trim()) return false;

  const classMatches = selectorText.match(/\.([a-zA-Z0-9_-]+)/g) || [];
  for (const match of classMatches) {
    const className = match.slice(1);
    if (sets.classes.has(className)) {
      return true;
    }
  }

  const idMatches = selectorText.match(/#([a-zA-Z0-9_-]+)/g) || [];
  for (const match of idMatches) {
    const idName = match.slice(1);
    if (sets.ids.has(idName)) {
      return true;
    }
  }

  const attrIdRegex = /\[id[~|^$*]?=['"]?([a-zA-Z0-9_-]+)['"]?\]/g;
  let attrMatch;
  while ((attrMatch = attrIdRegex.exec(selectorText)) !== null) {
    if (sets.ids.has(attrMatch[1])) {
      return true;
    }
  }

  const attrClassRegex = /\[class[~|^$*]?=['"]?([a-zA-Z0-9_-]+)['"]?\]/g;
  while ((attrMatch = attrClassRegex.exec(selectorText)) !== null) {
    if (sets.classes.has(attrMatch[1])) {
      return true;
    }
  }

  const tagRegex = /(^|[\s>+~,(])([a-zA-Z][a-zA-Z0-9-]*)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(selectorText)) !== null) {
    const tagName = tagMatch[2].toLowerCase();
    if (!GLOBAL_TAGS.has(tagName) && sets.tags.has(tagName)) {
      return true;
    }
  }

  return false;
}

function extractAnimationNames(cssBody: string): Set<string> {
  const animationNames = new Set<string>();
  const animationRegex = /animation(?:-name)?\s*:\s*([^;]+);?/gi;
  const ignoreTokens = new Set([
    'none',
    'inherit',
    'initial',
    'unset',
    'linear',
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'infinite',
    'normal',
    'reverse',
    'alternate',
    'alternate-reverse',
    'forwards',
    'backwards',
    'both',
    'running',
    'paused',
  ]);

  let match;
  while ((match = animationRegex.exec(cssBody)) !== null) {
    const value = match[1] || '';
    const parts = value.split(',');
    parts.forEach((part) => {
      const tokens = part.trim().split(/\s+/);
      for (const token of tokens) {
        if (!token) continue;
        if (ignoreTokens.has(token)) continue;
        if (/^-?\d/.test(token)) continue;
        if (/ms|s$/.test(token)) continue;
        animationNames.add(token);
        break;
      }
    });
  }

  return animationNames;
}

function findMatchingBrace(css: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < css.length; i += 1) {
    const char = css[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractAtRuleBlocks(css: string, ruleName: string): { remaining: string; blocks: string[]; namedBlocks?: Map<string, string> } {
  const blocks: string[] = [];
  const namedBlocks = new Map<string, string>();
  let result = '';
  let cursor = 0;
  const regex = new RegExp(`${ruleName}\\s+([^\\s{]+)?\\s*\\{`, 'gi');
  let match;

  while ((match = regex.exec(css)) !== null) {
    const start = match.index;
    const braceStart = css.indexOf('{', start);
    if (braceStart === -1) continue;
    const braceEnd = findMatchingBrace(css, braceStart);
    if (braceEnd === -1) continue;

    result += css.slice(cursor, start);
    const block = css.slice(start, braceEnd + 1);
    blocks.push(block);
    if (match[1]) {
      namedBlocks.set(match[1], block);
    }
    cursor = braceEnd + 1;
  }

  result += css.slice(cursor);
  return { remaining: result, blocks, namedBlocks: namedBlocks.size > 0 ? namedBlocks : undefined };
}

function filterCssForSelectors(css: string, sets: SelectorSets): { css: string; animations: Set<string> } {
  const output: string[] = [];
  const animations = new Set<string>();
  let i = 0;

  while (i < css.length) {
    if (/\s/.test(css[i])) {
      i += 1;
      continue;
    }

    if (css[i] === '@') {
      const atRuleStart = i;
      const braceIndex = css.indexOf('{', atRuleStart);
      const semiIndex = css.indexOf(';', atRuleStart);

      if (semiIndex !== -1 && (braceIndex === -1 || semiIndex < braceIndex)) {
        output.push(css.slice(atRuleStart, semiIndex + 1));
        i = semiIndex + 1;
        continue;
      }

      if (braceIndex === -1) {
        break;
      }

      const braceEnd = findMatchingBrace(css, braceIndex);
      if (braceEnd === -1) {
        break;
      }

      const atRuleHeader = css.slice(atRuleStart, braceIndex).trim();
      const inner = css.slice(braceIndex + 1, braceEnd);
      const isConditional = /@media|@supports|@container/i.test(atRuleHeader);

      if (isConditional) {
        const filteredInner = filterCssForSelectors(inner, sets);
        if (filteredInner.css.trim()) {
          output.push(`${atRuleHeader} {\n${filteredInner.css}\n}`);
          filteredInner.animations.forEach((name) => animations.add(name));
        }
      }

      i = braceEnd + 1;
      continue;
    }

    const selectorStart = i;
    const braceIndex = css.indexOf('{', selectorStart);
    if (braceIndex === -1) {
      break;
    }
    const braceEnd = findMatchingBrace(css, braceIndex);
    if (braceEnd === -1) {
      break;
    }

    const selectorText = css.slice(selectorStart, braceIndex).trim();
    const body = css.slice(braceIndex + 1, braceEnd).trim();

    if (selectorMatchesSets(selectorText, sets)) {
      output.push(`${selectorText} { ${body} }`);
      extractAnimationNames(body).forEach((name) => animations.add(name));
    }

    i = braceEnd + 1;
  }

  return { css: output.join('\n'), animations };
}

function extractComponentCss(html: string, fullCss: string): string {
  if (!fullCss.trim()) return '';

  const sets = extractSelectorsFromHtml(html);
  if (sets.classes.size === 0 && sets.ids.size === 0 && sets.tags.size === 0) {
    return '';
  }

  const keyframesExtracted = extractAtRuleBlocks(fullCss, '@keyframes');
  const fontFaceExtracted = extractAtRuleBlocks(keyframesExtracted.remaining, '@font-face');
  const filtered = filterCssForSelectors(fontFaceExtracted.remaining, sets);

  const filteredBlocks: string[] = [];
  if (fontFaceExtracted.blocks.length > 0) {
    filteredBlocks.push(fontFaceExtracted.blocks.join('\n'));
  }

  if (filtered.css.trim()) {
    filteredBlocks.push(filtered.css.trim());
  }

  if (filtered.animations.size > 0 && keyframesExtracted.namedBlocks) {
    filtered.animations.forEach((name) => {
      const block = keyframesExtracted.namedBlocks?.get(name);
      if (block) {
        filteredBlocks.push(block);
      }
    });
  }

  return filteredBlocks.join('\n').trim();
}

interface SaveComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorRef?: React.RefObject<EditorRefForSave>;
  initialCategory?: Category;
  onSaved?: () => void;
}

export function SaveComponentDialog({
  open,
  onOpenChange,
  editorRef,
  initialCategory = 'custom',
  onSaved,
}: SaveComponentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [extractedHtml, setExtractedHtml] = useState<string>('');
  const [extractedCss, setExtractedCss] = useState<string>('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: '',
      category: initialCategory,
      style: undefined as ComponentStyle | undefined, // Required but undefined initially
      description: '',
      html: '',
      tags: [],
    },
  });

  // Extract component data from editor when dialog opens
  useEffect(() => {
    if (!open || !editorRef?.current) return;

    const editor = editorRef.current.getEditor();
    if (!editor) return;

    try {
      const selected = editor.getSelected();
      
      if (!selected) {
        toast({
          title: 'No component selected',
          description: 'Please select a component in the editor before saving.',
          variant: 'destructive',
        });
        onOpenChange(false);
        return;
      }

      // Extract HTML from selected component (matches legacy: selected.toHTML())
      const componentHtml = selected.toHTML();
      
      // Extract only CSS for selected component (avoid saving entire page)
      const editorCss = editor.getCss();
      const componentCss = extractComponentCss(componentHtml, editorCss);

      // Set extracted values
      setExtractedHtml(componentHtml);
      setExtractedCss(componentCss);

      // Combine HTML and CSS (matches legacy format)
      const combinedHtml = componentCss
        ? `${componentHtml}<style>${componentCss}</style>`
        : componentHtml;
      
      // Set form value
      setValue('html', combinedHtml);
      
      // Auto-detect smart navigation tags
      const smartTags = detectSmartNavigation(combinedHtml);
      if (smartTags.length > 0) {
        const currentTags = watch('tags') || [];
        const newTags = [...new Set([...currentTags, ...smartTags])] as ComponentTag[];
        setValue('tags', newTags);
        
        toast({
          title: 'Smart navigation detected',
          description: `Found ${smartTags.length} navigation link(s). Tags added automatically.`,
        });
      }

      // Auto-generate preview using html2canvas (optional, non-blocking)
      generatePreview(selected.getEl(), combinedHtml)
        .then((preview) => {
          if (preview) {
            setThumbnail(preview);
          }
        })
        .catch((err) => {
          console.warn('Failed to generate preview:', err);
          // Not critical, continue without preview
        });
    } catch (error) {
      console.error('Failed to extract component data:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract component data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [open, editorRef, setValue, toast, onOpenChange]);

  // Generate preview image using html2canvas
  const generatePreview = async (element: HTMLElement | null, htmlContent: string): Promise<string | null> => {
    if (!element || typeof window === 'undefined') {
      return null;
    }

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 0.5,
        width: 300,
        height: 200,
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('Could not create preview:', err);
      return null;
    }
  };

  const onSubmit = async (data: ComponentFormData) => {
    setIsSubmitting(true);
    try {
      // Validate style is selected (required)
      if (!data.style) {
        throw new Error('Style is required. Please select a style.');
      }

      // CRITICAL FIX: Get fresh HTML and CSS from editor at save time
      // Don't rely on state - get directly from editor to ensure we have the latest content
      const editor = editorRef.current?.getEditor();
      if (!editor) {
        throw new Error('Editor not available. Please try again.');
      }

      // Get the selected component
      const selected = editor.getSelected();
      if (!selected) {
        throw new Error('No component selected. Please select a component in the editor.');
      }

      // CRITICAL FIX: Use EXACT method from working reference (lsb-redactor-fixed.js)
      // Reference uses: const html = selected.toHTML() - simple and works correctly
      // The corruption happens BEFORE extraction (during component loading), not during extraction
      let componentHtml = '';
      
      try {
        // PRIMARY METHOD: Use toHTML() exactly like working reference
        // This is what lsb-redactor-fixed.js uses and it works correctly
        componentHtml = selected.toHTML();
        
        // Validate HTML was extracted
        if (!componentHtml || componentHtml.trim().length === 0) {
          throw new Error('Component HTML is empty. Please ensure the component has content.');
        }
        
        // Log for debugging - check if HTML is already corrupted
        if (componentHtml.includes('""=""') || componentHtml.includes('"=""')) {
          console.warn('[SaveComponentDialog] ⚠️ WARNING: HTML appears to be corrupted before extraction!');
          console.warn('[SaveComponentDialog] This suggests corruption happened during component loading, not extraction.');
          console.warn('[SaveComponentDialog] HTML preview:', componentHtml.substring(0, 500));
        }
        
      } catch (htmlError) {
        console.error('[SaveComponentDialog] Error extracting HTML:', htmlError);
        throw new Error('Failed to extract component HTML. Please try selecting the component again.');
      }

      // Validate HTML was extracted
      if (!componentHtml || componentHtml.trim().length === 0) {
        throw new Error('Component HTML is empty. Please ensure the component has content.');
      }

      // Get CSS for selected component only (avoid saving full page CSS)
      const editorCss = editor.getCss() || '';
      const currentCss = extractComponentCss(componentHtml, editorCss);
      
      // Clean HTML - remove any inline style tags since CSS is saved separately
      // This ensures clean separation: html = structure, css = styling
      const cleanHtml = componentHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();

      // Final validation
      if (!cleanHtml || cleanHtml.length === 0) {
        throw new Error('Component HTML is empty after processing. Please check the component content.');
      }

      // Log for debugging
      console.log('[SaveComponentDialog] Saving component:', {
        name: data.name,
        htmlLength: cleanHtml.length,
        htmlPreview: cleanHtml.substring(0, 200),
        cssLength: currentCss.length,
        cssPreview: currentCss.substring(0, 100),
        hasCss: currentCss.length > 0,
        hasHtml: cleanHtml.length > 0,
      });

      await saveComponent({
        name: data.name,
        category: data.category,
        style: data.style, // Now required
        type: data.type,
        description: data.description,
        html: cleanHtml, // Clean HTML structure (CSS saved separately)
        css: currentCss || '', // Always save CSS (even if empty string, not null)
        js: data.js || '',
        tags: data.tags || [], // Now array of ComponentTag
        thumbnail: thumbnail || undefined,
        is_public: true, // Public by default for anonymous saves
      });

      toast({
        title: '✅ Component saved successfully!',
        description: `"${data.name}" has been added to your component library.`,
      });

      // Close dialog and refresh component list
      onSaved?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Failed to save component:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to save component. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('required')) {
          errorMessage = 'Please fill in all required fields (name, category, style).';
        } else if (error.message.includes('table') || error.message.includes('does not exist')) {
          errorMessage = 'Database table not found. Please contact support.';
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'A component with this name already exists. Please choose a different name.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: '❌ Save failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save Component</DialogTitle>
          <DialogDescription>
            Save this component to your library for reuse in other projects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Component Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="My Custom Header"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value as Category)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="button">Button</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          <StyleSelector
            value={watch('style')}
            onChange={(style) => setValue('style', style)}
            disabled={isSubmitting}
            required={true}
            error={errors.style?.message}
          />

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this component..."
              rows={2}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <TagSelector
            value={watch('tags') || []}
            onChange={(tags) => setValue('tags', tags)}
            disabled={isSubmitting}
            maxTags={10}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setThumbnail(undefined);
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Component'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

