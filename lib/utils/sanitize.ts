/**
 * Input Sanitization Utilities
 * 
 * Sanitize user inputs to prevent XSS and injection attacks.
 * 
 * Stage 3 Module 7: Chat with ChatGPT
 * Fixes BIG REVIEW.md #8: Input sanitization for user prompts
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize user prompt text
 * Removes potentially harmful content while preserving natural language
 */
export function sanitizePrompt(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  const withoutHtml = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // Remove script-like patterns
  const withoutScripts = withoutHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Remove control characters but preserve newlines and tabs
  const cleaned = withoutScripts
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  // Limit length (prevent DoS)
  const maxLength = 2000;
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) : cleaned;
}

/**
 * Sanitize JSON string before parsing
 */
export function sanitizeJsonString(jsonString: string): string {
  // Remove potential code injection
  return jsonString
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Validate and sanitize component data from AI response
 */
export function sanitizeComponentData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const obj = data as Record<string, unknown>;

  // Only allow safe keys
  const allowedKeys = ['type', 'category', 'style', 'props', 'html', 'className', 'text'];
  
  for (const key of allowedKeys) {
    if (key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Sanitize HTML strings
        if (key === 'html' || key === 'props') {
          sanitized[key] = sanitizeHtml(value, {
            allowedTags: sanitizeHtml.defaults.allowedTags,
            allowedAttributes: {
              '*': ['class', 'id', 'style', 'data-*'],
            },
          });
        } else {
          sanitized[key] = sanitizePrompt(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeComponentData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}








