/**
 * Validation Schemas
 * 
 * Zod schemas for runtime validation of component contracts.
 * Used for API validation, form validation, and data integrity.
 */

import { z } from 'zod';
import { COMPONENT_STYLES, ComponentStyle } from '@/lib/constants/styles';
import { ALL_TAGS, ComponentTag } from '@/lib/constants/tags';
import { ComponentContractSchema, InputPropSchema } from '@/lib/types/contracts';

/**
 * Validate ComponentStyle enum
 */
export const ComponentStyleSchema = z.enum(COMPONENT_STYLES as [string, ...string[]], {
  errorMap: () => ({ message: 'Style must be from predefined list' }),
});

/**
 * Validate ComponentTag enum
 */
export const ComponentTagSchema = z.enum(ALL_TAGS as [string, ...string[]], {
  errorMap: () => ({ message: 'Tag must be from predefined list' }),
});

/**
 * Validate array of ComponentTags
 */
export const ComponentTagsSchema = z.array(ComponentTagSchema).max(10, {
  message: 'Maximum 10 tags allowed',
}).default([]);

/**
 * Component Save Form Schema
 * Used in SaveComponentDialog
 */
export const ComponentSaveFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: z.enum(['header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom']),
  style: ComponentStyleSchema, // REQUIRED - no optional
  type: z.string().max(100).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  html: z.string().min(1, 'HTML content is required'),
  css: z.string().optional(),
  js: z.string().optional(),
  tags: ComponentTagsSchema,
  input_props: z.record(InputPropSchema).optional(),
});

export type ComponentSaveFormData = z.infer<typeof ComponentSaveFormSchema>;

/**
 * Validate component contract
 */
export function validateComponentContract(data: unknown): ComponentContractSchema['_output'] {
  return ComponentContractSchema.parse(data);
}

/**
 * Validate component save form
 */
export function validateComponentSaveForm(data: unknown): ComponentSaveFormData {
  return ComponentSaveFormSchema.parse(data);
}

/**
 * Validate style
 */
export function validateStyle(style: string): ComponentStyle {
  return ComponentStyleSchema.parse(style);
}

/**
 * Validate tags
 */
export function validateTags(tags: string[]): ComponentTag[] {
  return ComponentTagsSchema.parse(tags);
}

