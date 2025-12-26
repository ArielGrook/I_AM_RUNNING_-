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

      // Ensure we have extracted HTML
      if (!extractedHtml || extractedHtml.trim().length === 0) {
        throw new Error('No component data extracted. Please close and try again.');
      }

      // CRITICAL FIX: Get fresh CSS from editor (don't rely on extractedCss state)
      // The editor might have been updated since extraction, or CSS might be added via style manager
      const editor = editorRef.current?.getEditor();
      if (!editor) {
        throw new Error('Editor not available. Please try again.');
      }

      // Get fresh CSS from editor - this captures ALL CSS rules from the style manager
      const currentCss = editor.getCss() || '';
      
      // Clean HTML - remove any inline style tags since CSS is saved separately
      // This ensures clean separation: html = structure, css = styling
      const cleanHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();

      // Log for debugging
      console.log('[SaveComponentDialog] Saving component:', {
        name: data.name,
        htmlLength: cleanHtml.length,
        cssLength: currentCss.length,
        cssPreview: currentCss.substring(0, 100),
        hasCss: currentCss.length > 0,
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

