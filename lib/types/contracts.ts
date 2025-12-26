/**
 * JSON CONTRACT SCHEMAS
 * 
 * Complete TypeScript interfaces for AI-powered website builder architecture.
 * These schemas form the backbone of component system, AI integration, and site assembly.
 * 
 * Architecture: User → ChatGPT → JSON Contract → Component Database → Site Assembly → Live Preview
 */

import { z } from 'zod';
import { ComponentStyle } from '@/lib/constants/styles';
import { ComponentTag } from '@/lib/constants/tags';

// ============================================================================
// 1. COMPONENT CONTRACT SCHEMA
// ============================================================================

/**
 * Input property definition for quick edits
 * Enables user customization without code editing
 */
export const InputPropSchema = z.object({
  type: z.enum(['color', 'text', 'number', 'boolean', 'url', 'select', 'image']),
  default: z.any(),
  label: z.string(),
  description: z.string().optional(),
  options: z.array(z.string()).optional(), // For select type
  smart_tag: z.string().optional(), // Links to smart navigation tag
  min: z.number().optional(),
  max: z.number().optional(),
});

export type InputProp = z.infer<typeof InputPropSchema>;

/**
 * Component slot for nested components
 */
export const ComponentSlotSchema = z.object({
  name: z.string(),
  type: z.enum(['image', 'text', 'component', 'html']),
  default: z.string().optional(),
  required: z.boolean().default(false),
  description: z.string().optional(),
});

export type ComponentSlot = z.infer<typeof ComponentSlotSchema>;

/**
 * Component dependencies
 */
export const ComponentDependenciesSchema = z.object({
  scripts: z.array(z.string()).optional(), // e.g., ['jquery', 'gsap', 'bootstrap']
  styles: z.array(z.string()).optional(), // e.g., ['bootstrap', 'tailwind']
  fonts: z.array(z.string()).optional(), // e.g., ['Inter', 'Roboto']
});

export type ComponentDependencies = z.infer<typeof ComponentDependenciesSchema>;

/**
 * Component metadata
 */
export const ComponentMetaSchema = z.object({
  author: z.string().default('system'),
  version: z.string().default('1.0.0'),
  responsive: z.boolean().default(true),
  animation: z.boolean().default(false),
  accessibility: z.boolean().default(false),
  seo_optimized: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type ComponentMeta = z.infer<typeof ComponentMetaSchema>;

/**
 * Main Component Contract Schema
 * This is the definitive structure for all components in the database
 */
export const ComponentContractSchema = z.object({
  // Identification
  id: z.string(),
  name: z.string().min(1).max(100),
  category: z.enum(['header', 'footer', 'hero', 'section', 'button', 'form', 'navigation', 'custom']),
  type: z.string().optional(), // Component subtype (e.g., 'navbar', 'footer-simple')
  style: z.string().refine((val) => {
    // Validate against ComponentStyle enum
    const validStyles = [
      'modern_dark', 'modern_light', 'modern_gradient',
      'classic_white', 'classic_elegant',
      'minimal_dark', 'minimal_light',
      'corporate_blue', 'corporate_gray',
      'creative_colorful', 'creative_artistic',
      'vintage_retro', 'tech_neon',
      'medical_clean', 'restaurant_warm',
      'fashion_elegant', 'ecommerce_modern',
      'blog_readable', 'portfolio_showcase',
      'custom_authored',
    ];
    return validStyles.includes(val);
  }, { message: 'Invalid style. Must be from predefined style list.' }),
  
  // Component Code
  html: z.string().min(1),
  css: z.string().optional(),
  js: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()).default([]), // FROM DEFINITIVE TAG LIST
  preview_img: z.string().optional(), // Base64 preview image
  description: z.string().max(500).optional(),
  
  // Dependencies
  dependencies: ComponentDependenciesSchema.optional(),
  
  // Slots for nested components
  slots: z.array(ComponentSlotSchema).default([]),
  
  // Quick Edit Properties (CRITICAL for user customization)
  input_props: z.record(InputPropSchema).default({}),
  
  // Metadata
  meta: ComponentMetaSchema.optional(),
});

export type ComponentContract = z.infer<typeof ComponentContractSchema>;

// ============================================================================
// 2. SITE ASSEMBLY CONTRACT (For AI Generation)
// ============================================================================

/**
 * Component instance in site assembly
 */
export const ComponentInstanceSchema = z.object({
  component_id: z.string(),
  order: z.number(),
  props: z.record(z.any()).default({}), // Override default props
  slots: z.record(z.string()).optional(), // Fill component slots
});

export type ComponentInstance = z.infer<typeof ComponentInstanceSchema>;

/**
 * Page in site assembly
 */
export const AssemblyPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  components: z.array(ComponentInstanceSchema),
  meta: z.record(z.string()).optional(),
});

export type AssemblyPage = z.infer<typeof AssemblyPageSchema>;

/**
 * Site modules configuration
 */
export const SiteModulesSchema = z.object({
  cart: z.boolean().default(false),
  payment: z.boolean().default(false),
  auth: z.boolean().default(false),
  blog: z.boolean().default(false),
  cms: z.boolean().default(false),
});

export type SiteModules = z.infer<typeof SiteModulesSchema>;

/**
 * Deployment configuration
 */
export const DeploymentConfigSchema = z.object({
  domain: z.string().optional(),
  hosting: z.enum(['vps', 'cloud', 'static']).default('static'),
  ssl: z.boolean().default(true),
  cdn: z.boolean().default(false),
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

/**
 * Site Assembly Contract
 * Used by AI to generate complete site structure
 */
export const SiteAssemblyContractSchema = z.object({
  project_id: z.string(),
  project_name: z.string(),
  style: z.string(), // ComponentStyle
  
  pages: z.array(AssemblyPageSchema),
  
  modules: SiteModulesSchema.optional(),
  
  deployment: DeploymentConfigSchema.optional(),
  
  metadata: z.object({
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    ai_generated: z.boolean().default(false),
  }).optional(),
});

export type SiteAssemblyContract = z.infer<typeof SiteAssemblyContractSchema>;

// ============================================================================
// 3. STYLE CONTRACT (For AI Style Matching)
// ============================================================================

/**
 * Color palette
 */
export const ColorPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
  success: z.string().optional(),
  warning: z.string().optional(),
  error: z.string().optional(),
});

export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

/**
 * Typography configuration
 */
export const TypographyConfigSchema = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  headingSize: z.string().optional(),
  bodySize: z.string().optional(),
  lineHeight: z.string().optional(),
});

export type TypographyConfig = z.infer<typeof TypographyConfigSchema>;

/**
 * Style Contract
 * Defines style characteristics for AI matching
 */
export const StyleContractSchema = z.object({
  style_id: z.string(), // ComponentStyle
  name: z.string(),
  description: z.string().optional(),
  
  colors: ColorPaletteSchema,
  typography: TypographyConfigSchema,
  
  compatible_styles: z.array(z.string()).default([]),
  incompatible_styles: z.array(z.string()).default([]),
  
  metadata: z.object({
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  }).optional(),
});

export type StyleContract = z.infer<typeof StyleContractSchema>;

// ============================================================================
// 4. PARSING CONTRACT (ZIP Import Results)
// ============================================================================

/**
 * Extracted component from ZIP
 */
export const ExtractedComponentSchema = z.object({
  type: z.string(),
  html: z.string(),
  css: z.string().optional(),
  js: z.string().optional(),
  auto_categorized: z.boolean().default(false),
  suggested_style: z.string().optional(),
  suggested_tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).optional(),
});

export type ExtractedComponent = z.infer<typeof ExtractedComponentSchema>;

/**
 * Extracted assets
 */
export const ExtractedAssetSchema = z.object({
  filename: z.string(),
  type: z.string(), // 'image', 'font', 'script', 'style'
  data: z.string(), // Base64 or URL
  size: z.number().optional(),
});

export type ExtractedAsset = z.infer<typeof ExtractedAssetSchema>;

/**
 * Extracted scripts
 */
export const ExtractedScriptsSchema = z.object({
  vendor: z.array(z.string()).default([]),
  custom: z.array(z.string()).default([]),
  fonts: z.array(z.string()).default([]),
});

export type ExtractedScripts = z.infer<typeof ExtractedScriptsSchema>;

/**
 * Parsing Contract
 * Result of ZIP import parsing
 */
export const ParsingContractSchema = z.object({
  parse_id: z.string(),
  source: z.string(), // Original filename
  
  extracted: z.object({
    components: z.array(ExtractedComponentSchema),
    assets: z.array(ExtractedAssetSchema),
    scripts: ExtractedScriptsSchema.optional(),
  }),
  
  mapping: z.object({
    style_detected: z.string().optional(),
    components_count: z.number(),
    save_to_db: z.boolean().default(true),
  }),
  
  metadata: z.object({
    parsed_at: z.string().datetime(),
    processing_time: z.number().optional(),
  }).optional(),
});

export type ParsingContract = z.infer<typeof ParsingContractSchema>;

// ============================================================================
// 5. API RESPONSE CONTRACT
// ============================================================================

/**
 * Standard API Response Contract
 */
export const ApiResponseSchema = z.object({
  status: z.enum(['success', 'error', 'partial']),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  meta: z.object({
    timestamp: z.string().datetime(),
    api_version: z.string().default('1.0.0'),
    request_id: z.string().optional(),
  }).optional(),
});

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
  data?: T;
};

// ============================================================================
// 6. CHAT CONTRACT (For AI Integration)
// ============================================================================

/**
 * Chat request for AI component generation
 */
export const ChatRequestContractSchema = z.object({
  goal: z.string().min(1).max(1000),
  constraints: z.record(z.any()).optional(),
  preferred_styles: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  palette: ColorPaletteSchema.optional(),
  existing_components: z.array(z.string()).optional(), // Component IDs already in use
});

export type ChatRequestContract = z.infer<typeof ChatRequestContractSchema>;

/**
 * Chat response with generated components
 */
export const ChatResponseContractSchema = z.object({
  components: z.array(ComponentContractSchema),
  suggestions: z.array(z.string()).optional(),
  metadata: z.object({
    total_components: z.number(),
    estimated_time: z.string(),
    confidence: z.number().min(0).max(1),
    style_matched: z.string().optional(),
  }).optional(),
});

export type ChatResponseContract = z.infer<typeof ChatResponseContractSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate component contract
 */
export function validateComponentContract(data: unknown): ComponentContract {
  return ComponentContractSchema.parse(data);
}

/**
 * Validate site assembly contract
 */
export function validateSiteAssemblyContract(data: unknown): SiteAssemblyContract {
  return SiteAssemblyContractSchema.parse(data);
}

/**
 * Create default component contract
 */
export function createDefaultComponentContract(overrides: Partial<ComponentContract>): ComponentContract {
  return {
    id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Unnamed Component',
    category: 'custom',
    style: 'custom_authored',
    html: '',
    tags: [],
    slots: [],
    input_props: {},
    ...overrides,
  };
}



