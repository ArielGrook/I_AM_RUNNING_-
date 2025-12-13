/**
 * Unit Tests for Chat Streaming API
 * 
 * Tests for streaming chat responses and JSON-contract parsing.
 * 
 * Stage 3 Module 7: Chat with ChatGPT
 */

import { sanitizePrompt } from '@/lib/utils/sanitize';
import { JsonContractSchema } from '@/lib/types/chat';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

// Mock Redis
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => ({
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(true),
  })),
  isRedisAvailable: jest.fn().mockResolvedValue(true),
}));

describe('Chat Streaming', () => {
  describe('Input Sanitization', () => {
    it('should sanitize HTML tags from prompts', () => {
      const input = '<script>alert("xss")</script>Hello world';
      const sanitized = sanitizePrompt(input);
      expect(sanitized).toBe('Hello world');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove javascript: protocol', () => {
      const input = 'Click here: javascript:alert(1)';
      const sanitized = sanitizePrompt(input);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should limit length to prevent DoS', () => {
      const longInput = 'a'.repeat(5000);
      const sanitized = sanitizePrompt(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(2000);
    });

    it('should preserve natural language', () => {
      const input = 'Create a modern header with navigation';
      const sanitized = sanitizePrompt(input);
      expect(sanitized).toBe(input);
    });
  });

  describe('JSON Contract Parsing', () => {
    it('should parse valid contract', () => {
      const contract = {
        action: 'create',
        components: [
          {
            type: 'header',
            category: 'header',
            style: 'modern',
            html: '<header>Test</header>',
          },
        ],
      };

      const parsed = JsonContractSchema.parse(contract);
      expect(parsed.action).toBe('create');
      expect(parsed.components.length).toBe(1);
    });

    it('should reject invalid action', () => {
      const contract = {
        action: 'invalid',
        components: [],
      };

      expect(() => JsonContractSchema.parse(contract)).toThrow();
    });

    it('should handle optional fields', () => {
      const contract = {
        action: 'style',
        components: [],
        styles: {
          colors: {
            primary: '#ff0000',
          },
        },
      };

      const parsed = JsonContractSchema.parse(contract);
      expect(parsed.styles?.colors?.primary).toBe('#ff0000');
    });
  });
});








