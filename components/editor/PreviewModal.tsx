/**
 * Preview Modal Component
 * 
 * Displays project preview in an iframe with watermark support.
 * Handles dev tools detection and RTL layouts.
 * 
 * Stage 4 Module 11: Monetization
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, AlertTriangle } from 'lucide-react';
import { injectWatermarkScript } from '@/lib/utils/watermark';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string | null;
  isRTL?: boolean;
  watermarked?: boolean;
  projectName?: string;
}

export function PreviewModal({
  open,
  onOpenChange,
  previewUrl,
  isRTL = false,
  watermarked = false,
  projectName = 'Preview',
}: PreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [devToolsDetected, setDevToolsDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle dev tools detection from iframe
  useEffect(() => {
    if (!open || !watermarked) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'devtools-detected') {
        setDevToolsDetected(true);
        // Optionally close the preview
        // onOpenChange(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, watermarked, onOpenChange]);

  // Inject watermark script when iframe loads
  useEffect(() => {
    if (!open || !iframeRef.current || !watermarked) return;

    const iframe = iframeRef.current;
    
    const handleLoad = () => {
      setIsLoading(false);
      // Try to inject watermark script
      try {
        injectWatermarkScript(iframe, isRTL);
      } catch (error) {
        // Cross-origin or other error - watermark is already in HTML
        console.warn('Could not inject watermark script:', error);
      }
    };

    iframe.addEventListener('load', handleLoad);
    
    // If already loaded
    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [open, watermarked, isRTL]);

  // Reset state and clean up blob URL when modal closes
  useEffect(() => {
    if (!open) {
      setDevToolsDetected(false);
      setIsLoading(true);
      // Clean up blob URL to prevent memory leaks
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [open, previewUrl]);

  // Open in new window
  const handleOpenInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!previewUrl) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {projectName} - Preview
              {watermarked && (
                <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  DEMO
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {watermarked && devToolsDetected && (
                <div className="flex items-center gap-2 text-orange-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Dev tools detected</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewWindow}
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative bg-gray-100 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading preview...</p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title={`Preview of ${projectName}`}
            sandbox="allow-same-origin allow-scripts"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          />
        </div>
        
        {watermarked && (
          <div className="px-6 py-3 bg-orange-50 border-t border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Demo Mode:</strong> This preview includes a watermark. 
              Upgrade to remove watermarks and unlock all features.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

