/**
 * Unit Tests for ZIP Parser
 * 
 * Tests for parseZip function with various scenarios.
 * 
 * Stage 2 Module 4: ZIP-Parser Core enhancements
 */

import { parseZip, ZipParseError } from '@/lib/parser';
import { ProjectSchema } from '@/lib/types/project';

// Mock JSZip
jest.mock('jszip', () => {
  const mockZip = {
    loadAsync: jest.fn(),
    files: {},
  };
  return jest.fn(() => mockZip);
});

describe('parseZip', () => {
  const createMockZipBuffer = (files: Record<string, string>): ArrayBuffer => {
    // Simplified mock - in real tests, would create actual ZIP
    return new ArrayBuffer(100);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should throw SIZE_EXCEEDED error for files larger than maxSize', async () => {
      const largeFile = new ArrayBuffer(60 * 1024 * 1024); // 60MB
      const maxSize = 50 * 1024 * 1024; // 50MB

      await expect(
        parseZip(largeFile, { maxSize })
      ).rejects.toThrow(ZipParseError);

      await expect(
        parseZip(largeFile, { maxSize })
      ).rejects.toMatchObject({
        code: 'SIZE_EXCEEDED',
      });
    });

    it('should throw INVALID_FORMAT error for corrupted ZIP', async () => {
      const corruptedFile = new ArrayBuffer(100);
      
      // Mock JSZip to throw error
      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.loadAsync.mockRejectedValue(new Error('Invalid ZIP'));

      await expect(
        parseZip(corruptedFile)
      ).rejects.toThrow(ZipParseError);

      await expect(
        parseZip(corruptedFile)
      ).rejects.toMatchObject({
        code: expect.stringMatching(/INVALID_FORMAT|CORRUPTED/),
      });
    });

    it('should handle empty ZIP files gracefully', async () => {
      const emptyFile = new ArrayBuffer(0);
      
      // This should either throw or return empty project
      // Implementation depends on JSZip behavior
      await expect(
        parseZip(emptyFile)
      ).rejects.toThrow();
    });
  });

  describe('Progress Callbacks', () => {
    it('should call progress callback during parsing', async () => {
      const progressCalls: unknown[] = [];
      const onProgress = jest.fn((progress) => {
        progressCalls.push(progress);
      });

      const mockFile = new ArrayBuffer(100);
      
      // Mock successful ZIP with files
      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.files = {
        'index.html': {
          dir: false,
          async: jest.fn().mockResolvedValue('<html><body><h1>Test</h1></body></html>'),
        },
      };
      mockZip.loadAsync.mockResolvedValue(mockZip);

      try {
        await parseZip(mockFile, { onProgress });
      } catch {
        // May fail due to incomplete mock, but progress should be called
      }

      // Progress should be called at least once
      expect(onProgress).toHaveBeenCalled();
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    it('should report progress stages correctly', async () => {
      const stages: string[] = [];
      const onProgress = jest.fn((progress) => {
        stages.push(progress.stage);
      });

      const mockFile = new ArrayBuffer(100);
      
      // Mock successful ZIP
      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.files = {};
      mockZip.loadAsync.mockResolvedValue(mockZip);

      try {
        await parseZip(mockFile, { onProgress });
      } catch {
        // May fail, but stages should be tracked
      }

      // Should have at least 'loading' stage
      expect(stages).toContain('loading');
    });
  });

  describe('Canvas Clearing', () => {
    it('should call clearCanvas callback before parsing', async () => {
      const clearCanvas = jest.fn().mockResolvedValue(undefined);
      const mockFile = new ArrayBuffer(100);

      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.files = {};
      mockZip.loadAsync.mockResolvedValue(mockZip);

      try {
        await parseZip(mockFile, { clearCanvas });
      } catch {
        // May fail, but clearCanvas should be called
      }

      expect(clearCanvas).toHaveBeenCalled();
    });

    it('should continue parsing even if clearCanvas fails', async () => {
      const clearCanvas = jest.fn().mockRejectedValue(new Error('Clear failed'));
      const mockFile = new ArrayBuffer(100);

      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.files = {};
      mockZip.loadAsync.mockResolvedValue(mockZip);

      // Should not throw due to clearCanvas error
      await expect(
        parseZip(mockFile, { clearCanvas })
      ).resolves.not.toThrow();
    });
  });

  describe('File Processing', () => {
    it('should process HTML files correctly', async () => {
      const mockFile = new ArrayBuffer(100);
      
      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.files = {
        'index.html': {
          dir: false,
          async: jest.fn().mockResolvedValue(
            '<html><head><title>Test Page</title></head><body><h1>Hello</h1></body></html>'
          ),
        },
      };
      mockZip.loadAsync.mockResolvedValue(mockZip);

      const result = await parseZip(mockFile);

      expect(result.project.pages.length).toBeGreaterThan(0);
      expect(result.project.pages[0].title).toBe('Test Page');
    });

    it('should skip directory entries', async () => {
      const mockFile = new ArrayBuffer(100);
      
      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.files = {
        'folder/': {
          dir: true,
        },
        'index.html': {
          dir: false,
          async: jest.fn().mockResolvedValue('<html><body></body></html>'),
        },
      };
      mockZip.loadAsync.mockResolvedValue(mockZip);

      const result = await parseZip(mockFile);

      // Should only process index.html, not folder/
      expect(result.project.pages.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('should validate project structure with ProjectSchema', async () => {
      const mockFile = new ArrayBuffer(100);
      
      const JSZip = require('jszip');
      const mockZip = new JSZip();
      mockZip.files = {
        'index.html': {
          dir: false,
          async: jest.fn().mockResolvedValue('<html><body></body></html>'),
        },
      };
      mockZip.loadAsync.mockResolvedValue(mockZip);

      const result = await parseZip(mockFile);

      // Should pass schema validation
      expect(() => {
        ProjectSchema.parse(result.project);
      }).not.toThrow();
    });
  });
});








