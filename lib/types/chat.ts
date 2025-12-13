/**
 * Chat Types
 * 
 * Type definitions for chat interface and JSON-contract system.
 * 
 * Stage 3 Module 7: Chat with ChatGPT
 */

import { z } from 'zod';
import { Category, StyleVariant } from './project';

/**
 * JSON-Contract Schema
 * Structured format for AI to describe website components
 */
export const JsonContractSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'style']),
  components: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    category: z.enum(['header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom']),
    style: z.enum(['minimal', 'modern', 'classic', 'bold', 'elegant', 'playful']).optional(),
    html: z.string().optional(),
    props: z.record(z.any()).optional(),
    position: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
  })),
  styles: z.object({
    colors: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    }).optional(),
    fonts: z.object({
      heading: z.string().optional(),
      body: z.string().optional(),
    }).optional(),
  }).optional(),
  message: z.string().optional(),
});

export type JsonContract = z.infer<typeof JsonContractSchema>;

/**
 * Chat Message Schema
 */
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number(),
  contract: JsonContractSchema.optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Chat Request Schema
 */
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    currentProject: z.any().optional(),
    selectedComponents: z.array(z.string()).optional(),
    language: z.string().optional(),
  }).optional(),
  stream: z.boolean().optional().default(false),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Chat Response Schema
 */
export const ChatResponseSchema = z.object({
  message: z.string(),
  contract: JsonContractSchema.optional(),
  suggestions: z.array(z.string()).optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;








