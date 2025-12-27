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
import { type GrapeEditorRef } from './GrapeEditor';
import { StyleSelector } from './StyleSelector';
import { TagSelector } from './TagSelector';
import { detectSmartNavigation } from '@/lib/utils/smart-navigation';
import { ComponentSaveFormSchema, type ComponentSaveFormData } from '@/lib/schemas/validation';

const componentSchema = ComponentSaveFormSchema;

type ComponentFormData = ComponentSaveFormData;

interface SaveComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorRef?: React.RefObject<GrapeEditorRef>;
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
      
      // Extract ALL CSS from editor (matches legacy: editor.getCss())
      const editorCss = editor.getCss();

      // Set extracted values
      setExtractedHtml(componentHtml);
      setExtractedCss(editorCss);

      // Combine HTML and CSS (matches legacy format)
      const combinedHtml = `${componentHtml}<style>${editorCss}</style>`;
      
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

      // CRITICAL FIX: Extract HTML using DOM outerHTML to preserve all attributes correctly
      // This prevents attribute corruption (e.g., viewBox="0 0 40 40" staying intact)
      // Reference: lsb-redactor-fixed.js uses selected.toHTML() which works, but outerHTML is more reliable
      let componentHtml = '';
      
      try {
        // Method 1: Use outerHTML directly from DOM element (PRESERVES ALL ATTRIBUTES)
        // This is the most reliable method as it gets the raw HTML from the browser
        // outerHTML preserves exact attribute values including spaces (viewBox="0 0 40 40")
        const element = selected.getEl();
        if (element && element.outerHTML) {
          componentHtml = element.outerHTML;
          console.log('[SaveComponentDialog] ✅ Using outerHTML from DOM element (preserves all attributes)');
        }
        
        // Method 2: Fallback to toHTML() if outerHTML not available
        // This matches the working reference implementation
        if (!componentHtml || componentHtml.trim().length === 0) {
          console.warn('[SaveComponentDialog] outerHTML not available, trying toHTML()...');
          componentHtml = selected.toHTML();
        }
        
        // Method 3: Fallback to innerHTML if toHTML() fails
        if (!componentHtml || componentHtml.trim().length === 0) {
          console.warn('[SaveComponentDialog] toHTML() returned empty, trying innerHTML...');
          if (element) {
            componentHtml = element.innerHTML || '';
          }
        }
        
        // Method 4: Build HTML from component structure (LAST RESORT)
        // Only use this if all other methods fail, and properly escape attribute values
        if (!componentHtml || componentHtml.trim().length === 0) {
          console.warn('[SaveComponentDialog] Building HTML from component structure...');
          const tagName = selected.get('tagName') || 'div';
          const attributes = selected.getAttributes();
          
          // CRITICAL: Properly escape attribute values to preserve spaces and special characters
          // This ensures viewBox="0 0 40 40" stays intact, not split into multiple attributes
          const attrsString = Object.entries(attributes)
            .map(([key, value]) => {
              // Escape quotes in value and preserve spaces
              const escapedValue = String(value)
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
              return `${key}="${escapedValue}"`;
            })
            .join(' ');
          
          const children = selected.components();
          const childrenHtml = children.length > 0
            ? children.map((child: any) => {
                try {
                  // Try outerHTML first for children too
                  const childEl = child.getEl();
                  return childEl?.outerHTML || child.toHTML() || '';
                } catch {
                  return child.toHTML() || '';
                }
              }).join('')
            : selected.get('content') || '';
          
          componentHtml = `<${tagName}${attrsString ? ' ' + attrsString : ''}>${childrenHtml}</${tagName}>`;
        }
        
        // Validate HTML contains valid markup and check for attribute corruption
        if (componentHtml) {
          // Check for common SVG attributes that should have spaces
          const svgAttributes = ['viewBox', 'points', 'd', 'transform'];
          for (const attr of svgAttributes) {
            const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
            const match = componentHtml.match(regex);
            if (match && match[1]) {
              const value = match[1];
              // Check if attribute value looks corrupted (has unexpected quotes or = signs)
              if (value.includes('"') || value.includes('=') || value.split(' ').length === 1 && attr === 'viewBox') {
                console.warn(`[SaveComponentDialog] ⚠️ WARNING: ${attr} attribute may be corrupted:`, value);
                console.warn(`[SaveComponentDialog] Full HTML preview:`, componentHtml.substring(0, 500));
              }
            }
          }
        }
        
      } catch (htmlError) {
        console.error('[SaveComponentDialog] Error extracting HTML:', htmlError);
        throw new Error('Failed to extract component HTML. Please try selecting the component again.');
      }

      // Validate HTML was extracted
      if (!componentHtml || componentHtml.trim().length === 0) {
        throw new Error('Component HTML is empty. Please ensure the component has content.');
      }

      // Get fresh CSS from editor - this captures ALL CSS rules from the style manager
      const currentCss = editor.getCss() || '';
      
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

