/**
 * Watermark Utilities Tests
 * 
 * Tests for watermark generation, RTL support, and dev tools detection.
 * 
 * Stage 4 Module 11: Monetization
 */

import {
  generateWatermarkOverlay,
  createWatermarkedPreviewUrl,
  shouldApplyWatermark,
} from '@/lib/utils/watermark';
import { getUserPackage } from '@/lib/utils/user-package';
import { isDemoMode } from '@/lib/utils/demo-mode';

// Mock dependencies
jest.mock('@/lib/utils/user-package');
jest.mock('@/lib/utils/demo-mode');

describe('Watermark Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and Blob
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.Blob = jest.fn() as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateWatermarkOverlay', () => {
    it('should generate watermark overlay for LTR', () => {
      const overlay = generateWatermarkOverlay(false);
      
      expect(overlay).toContain('watermark-overlay');
      expect(overlay).toContain('direction: ltr');
      expect(overlay).toContain('I AM RUNNING - DEMO');
      expect(overlay).toContain('left: 50%');
      expect(overlay).toContain("translate('-50%'");
    });

    it('should generate watermark overlay for RTL', () => {
      const overlay = generateWatermarkOverlay(true);
      
      expect(overlay).toContain('watermark-overlay');
      expect(overlay).toContain('direction: rtl');
      expect(overlay).toContain('I AM RUNNING - DEMO');
      expect(overlay).toContain('right: 50%');
      expect(overlay).toContain("translate('50%'");
      expect(overlay).toContain('text-align: right');
    });

    it('should include pointer-events: none', () => {
      const overlay = generateWatermarkOverlay(false);
      expect(overlay).toContain('pointer-events: none');
    });

    it('should include z-index: 9999', () => {
      const overlay = generateWatermarkOverlay(false);
      expect(overlay).toContain('z-index: 9999');
    });
  });

  describe('createWatermarkedPreviewUrl', () => {
    it('should create watermarked preview URL for LTR', () => {
      const html = '<div>Test Content</div>';
      const url = createWatermarkedPreviewUrl(html, false);
      
      expect(global.Blob).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(url).toBe('blob:mock-url');
    });

    it('should create watermarked preview URL for RTL', () => {
      const html = '<div>Test Content</div>';
      const url = createWatermarkedPreviewUrl(html, true);
      
      expect(global.Blob).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(url).toBe('blob:mock-url');
    });

    it('should include watermark overlay in HTML', () => {
      const html = '<div>Test Content</div>';
      createWatermarkedPreviewUrl(html, false);
      
      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const htmlContent = blobCall[0][0];
      
      expect(htmlContent).toContain('watermark-overlay');
      expect(htmlContent).toContain('I AM RUNNING - DEMO');
      expect(htmlContent).toContain('<!DOCTYPE html>');
    });

    it('should include RTL attributes when isRTL is true', () => {
      const html = '<div>Test Content</div>';
      createWatermarkedPreviewUrl(html, true);
      
      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const htmlContent = blobCall[0][0];
      
      expect(htmlContent).toContain('dir="rtl"');
      expect(htmlContent).toContain('lang="he"');
      expect(htmlContent).toContain('direction: rtl');
    });

    it('should include obfuscated dev tools detection script', () => {
      const html = '<div>Test Content</div>';
      createWatermarkedPreviewUrl(html, false);
      
      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const htmlContent = blobCall[0][0];
      
      expect(htmlContent).toContain('<script>');
      expect(htmlContent).toContain('devtools-detected');
      expect(htmlContent).toContain('postMessage');
    });
  });

  describe('shouldApplyWatermark', () => {
    it('should return true when user has no package', async () => {
      (getUserPackage as jest.Mock).mockResolvedValue(null);
      (isDemoMode as jest.Mock).mockReturnValue(false);
      
      const result = await shouldApplyWatermark();
      expect(result).toBe(true);
    });

    it('should return true when user is in demo mode', async () => {
      (getUserPackage as jest.Mock).mockResolvedValue(null);
      (isDemoMode as jest.Mock).mockReturnValue(true);
      
      const result = await shouldApplyWatermark();
      expect(result).toBe(true);
    });

    it('should return false when user has active package', async () => {
      (getUserPackage as jest.Mock).mockResolvedValue({
        id: 'test-id',
        user_id: 'user-123',
        package_type: 'landing',
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: null,
      });
      (isDemoMode as jest.Mock).mockReturnValue(false);
      
      const result = await shouldApplyWatermark();
      expect(result).toBe(false);
    });

    it('should return true when user has package but is in demo mode', async () => {
      (getUserPackage as jest.Mock).mockResolvedValue({
        id: 'test-id',
        user_id: 'user-123',
        package_type: 'landing',
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: null,
      });
      (isDemoMode as jest.Mock).mockReturnValue(true);
      
      const result = await shouldApplyWatermark();
      expect(result).toBe(true);
    });
  });
});




