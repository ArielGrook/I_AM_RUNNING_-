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
import { Category, StyleVariant } from '@/lib/types/project';
import { saveComponent } from '@/lib/components/supabase-catalog';
import { useToast } from '@/components/ui/use-toast';
import { AddScreenshotButton } from './AddScreenshotButton';
import { type GrapeEditorRef } from './GrapeEditor';

const componentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: z.enum(['header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom']),
  style: z.enum(['minimal', 'modern', 'classic', 'bold', 'elegant', 'playful']).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  html: z.string().min(1, 'HTML content is required'),
  tags: z.string().optional(), // Comma-separated tags
});

type ComponentFormData = z.infer<typeof componentSchema>;

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
  const [savedComponentId, setSavedComponentId] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [extractedHtml, setExtractedHtml] = useState<string>('');
  const [extractedCss, setExtractedCss] = useState<string>('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
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
      style: undefined,
      description: '',
      html: '',
      tags: '',
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

      // Auto-generate preview using html2canvas
      setIsGeneratingPreview(true);
      generatePreview(selected.getEl(), combinedHtml)
        .then((preview) => {
          if (preview) {
            setThumbnail(preview);
          }
          setIsGeneratingPreview(false);
        })
        .catch((err) => {
          console.warn('Failed to generate preview:', err);
          // Not critical, continue without preview
          setIsGeneratingPreview(false);
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
      // Parse tags
      const tags = data.tags
        ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Ensure we have extracted HTML/CSS
      if (!extractedHtml || !extractedCss) {
        throw new Error('No component data extracted. Please close and try again.');
      }

      // Combined HTML with style tag (matches legacy format)
      const combinedHtml = `${extractedHtml}<style>${extractedCss}</style>`;

      const saved = await saveComponent({
        name: data.name,
        category: data.category,
        style: data.style,
        description: data.description,
        html: combinedHtml, // Save combined HTML (legacy format)
        tags,
        thumbnail: thumbnail || undefined,
        is_public: false, // Default to private
      });

      setSavedComponentId(saved.id);

      toast({
        title: 'Component saved',
        description: 'Your component has been saved successfully.',
      });

      // Don't close dialog yet - allow user to add screenshot
      // onSaved?.();
      // onOpenChange(false);
    } catch (error) {
      console.error('Failed to save component:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save component',
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

          <div>
            <Label htmlFor="style">Style (Optional)</Label>
            <Select
              value={watch('style') || ''}
              onValueChange={(value) => setValue('style', value as StyleVariant)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="style">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="elegant">Elegant</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div>
            <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="responsive, modern, dark"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="html">HTML Content</Label>
            {isGeneratingPreview && (
              <p className="text-xs text-gray-500 mb-2">Generating preview...</p>
            )}
            <Textarea
              id="html"
              {...register('html')}
              rows={8}
              className="font-mono text-sm"
              disabled={isSubmitting || isGeneratingPreview}
              readOnly
            />
            {errors.html && (
              <p className="text-sm text-red-500 mt-1">{errors.html.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              HTML and CSS extracted from selected component. This content is read-only.
            </p>
          </div>

          {savedComponentId && (
            <div className="border-t pt-4">
              <Label>Add Screenshot (Optional)</Label>
              <p className="text-sm text-gray-500 mb-2">
                Generate a screenshot preview for this component.
              </p>
              <AddScreenshotButton
                componentId={savedComponentId}
                componentHtml={watch('html')}
                onScreenshotAdded={(thumb) => {
                  setThumbnail(thumb);
                  toast({
                    title: 'Screenshot added',
                    description: 'Screenshot has been generated and saved.',
                  });
                }}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSavedComponentId(null);
                setThumbnail(undefined);
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              {savedComponentId ? 'Close' : 'Cancel'}
            </Button>
            {!savedComponentId ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Component'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  reset();
                  setSavedComponentId(null);
                  setThumbnail(undefined);
                  onSaved?.();
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

