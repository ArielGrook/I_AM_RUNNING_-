/**
 * Add Screenshot Button
 * 
 * Button to generate and add screenshot for a component.
 * 
 * Stage 2 Module 6: Visual Library
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { generateScreenshotFromHtml, getCachedScreenshot, generateScreenshotKey } from '@/lib/utils/screenshot';
import { updateComponent } from '@/lib/components/supabase-catalog';
import { useToast } from '@/components/ui/use-toast';

interface AddScreenshotButtonProps {
  componentId: string;
  componentHtml: string;
  onScreenshotAdded?: (thumbnail: string) => void;
}

export function AddScreenshotButton({
  componentId,
  componentHtml,
  onScreenshotAdded,
}: AddScreenshotButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleAddScreenshot = async () => {
    if (!componentHtml || componentHtml.trim().length === 0) {
      toast({
        title: 'Error',
        description: 'No HTML content to generate screenshot from',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const cacheKey = generateScreenshotKey(componentHtml);
      
      const screenshot = await getCachedScreenshot(
        cacheKey,
        () => generateScreenshotFromHtml(componentHtml, 400, 300)
      );

      // Update component with thumbnail
      await updateComponent(componentId, {
        thumbnail: screenshot,
      });

      toast({
        title: 'Screenshot added',
        description: 'Screenshot has been generated and saved.',
      });

      onScreenshotAdded?.(screenshot);
    } catch (error) {
      console.error('Failed to generate screenshot:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate screenshot',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleAddScreenshot}
      disabled={isGenerating || !componentHtml}
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Camera className="w-4 h-4 mr-2" />
          Add Screenshot
        </>
      )}
    </Button>
  );
}








