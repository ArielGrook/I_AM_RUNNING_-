/**
 * DEFINITIVE STYLE VARIATIONS
 * 
 * Complete list of all possible component styles for the component database.
 * This ensures clean categorization and prevents style proliferation.
 * 
 * CRITICAL: All component saves MUST use only these predefined styles.
 * No custom/free-text style entry allowed.
 */

export const COMPONENT_STYLES = [
  'modern_dark',
  'modern_light',
  'modern_gradient',
  'classic_white',
  'classic_elegant',
  'minimal_dark',
  'minimal_light',
  'corporate_blue',
  'corporate_gray',
  'creative_colorful',
  'creative_artistic',
  'vintage_retro',
  'tech_neon',
  'medical_clean',
  'restaurant_warm',
  'fashion_elegant',
  'ecommerce_modern',
  'blog_readable',
  'portfolio_showcase',
  'custom_authored',
] as const;

export type ComponentStyle = typeof COMPONENT_STYLES[number];

/**
 * Style metadata for UI display and AI matching
 */
export const STYLE_METADATA: Record<ComponentStyle, {
  label: string;
  description: string;
  primaryColor: string;
  compatibleStyles: ComponentStyle[];
  incompatibleStyles: ComponentStyle[];
}> = {
  modern_dark: {
    label: 'Modern Dark',
    description: 'Modern design with dark theme',
    primaryColor: '#1a1a1a',
    compatibleStyles: ['modern_dark', 'modern_gradient', 'tech_neon'],
    incompatibleStyles: ['classic_white', 'minimal_light', 'medical_clean'],
  },
  modern_light: {
    label: 'Modern Light',
    description: 'Modern design with light theme',
    primaryColor: '#ffffff',
    compatibleStyles: ['modern_light', 'modern_gradient', 'minimal_light'],
    incompatibleStyles: ['modern_dark', 'vintage_retro', 'tech_neon'],
  },
  modern_gradient: {
    label: 'Modern Gradient',
    description: 'Modern design with gradient effects',
    primaryColor: '#4F46E5',
    compatibleStyles: ['modern_dark', 'modern_light', 'creative_colorful'],
    incompatibleStyles: ['classic_white', 'minimal_dark', 'medical_clean'],
  },
  classic_white: {
    label: 'Classic White',
    description: 'Classic clean white design',
    primaryColor: '#ffffff',
    compatibleStyles: ['classic_elegant', 'minimal_light', 'medical_clean'],
    incompatibleStyles: ['modern_dark', 'tech_neon', 'vintage_retro'],
  },
  classic_elegant: {
    label: 'Classic Elegant',
    description: 'Classic elegant design',
    primaryColor: '#2c2c2c',
    compatibleStyles: ['classic_white', 'fashion_elegant', 'minimal_light'],
    incompatibleStyles: ['tech_neon', 'creative_colorful', 'vintage_retro'],
  },
  minimal_dark: {
    label: 'Minimal Dark',
    description: 'Minimal dark design',
    primaryColor: '#000000',
    compatibleStyles: ['modern_dark', 'minimal_light', 'corporate_gray'],
    incompatibleStyles: ['creative_colorful', 'tech_neon', 'restaurant_warm'],
  },
  minimal_light: {
    label: 'Minimal Light',
    description: 'Minimal light design',
    primaryColor: '#ffffff',
    compatibleStyles: ['modern_light', 'classic_white', 'medical_clean'],
    incompatibleStyles: ['modern_dark', 'tech_neon', 'vintage_retro'],
  },
  corporate_blue: {
    label: 'Corporate Blue',
    description: 'Corporate professional blue',
    primaryColor: '#1e40af',
    compatibleStyles: ['corporate_gray', 'modern_light', 'minimal_light'],
    incompatibleStyles: ['creative_colorful', 'tech_neon', 'restaurant_warm'],
  },
  corporate_gray: {
    label: 'Corporate Gray',
    description: 'Corporate professional gray',
    primaryColor: '#4b5563',
    compatibleStyles: ['corporate_blue', 'minimal_dark', 'modern_dark'],
    incompatibleStyles: ['creative_colorful', 'restaurant_warm', 'fashion_elegant'],
  },
  creative_colorful: {
    label: 'Creative Colorful',
    description: 'Creative with bright colors',
    primaryColor: '#ec4899',
    compatibleStyles: ['creative_artistic', 'modern_gradient', 'tech_neon'],
    incompatibleStyles: ['corporate_blue', 'corporate_gray', 'medical_clean'],
  },
  creative_artistic: {
    label: 'Creative Artistic',
    description: 'Creative artistic design',
    primaryColor: '#8b5cf6',
    compatibleStyles: ['creative_colorful', 'modern_gradient', 'portfolio_showcase'],
    incompatibleStyles: ['corporate_blue', 'corporate_gray', 'medical_clean'],
  },
  vintage_retro: {
    label: 'Vintage Retro',
    description: 'Vintage retro style',
    primaryColor: '#92400e',
    compatibleStyles: ['fashion_elegant', 'creative_artistic'],
    incompatibleStyles: ['modern_light', 'tech_neon', 'medical_clean'],
  },
  tech_neon: {
    label: 'Tech Neon',
    description: 'Tech with neon accents',
    primaryColor: '#00ff88',
    compatibleStyles: ['modern_dark', 'creative_colorful', 'modern_gradient'],
    incompatibleStyles: ['classic_white', 'medical_clean', 'restaurant_warm'],
  },
  medical_clean: {
    label: 'Medical Clean',
    description: 'Medical/healthcare clean',
    primaryColor: '#ffffff',
    compatibleStyles: ['minimal_light', 'classic_white', 'corporate_blue'],
    incompatibleStyles: ['tech_neon', 'creative_colorful', 'vintage_retro'],
  },
  restaurant_warm: {
    label: 'Restaurant Warm',
    description: 'Restaurant/food warm tones',
    primaryColor: '#f97316',
    compatibleStyles: ['fashion_elegant', 'creative_artistic'],
    incompatibleStyles: ['tech_neon', 'corporate_blue', 'minimal_dark'],
  },
  fashion_elegant: {
    label: 'Fashion Elegant',
    description: 'Fashion/beauty elegant',
    primaryColor: '#ec4899',
    compatibleStyles: ['classic_elegant', 'restaurant_warm', 'portfolio_showcase'],
    incompatibleStyles: ['tech_neon', 'corporate_gray', 'medical_clean'],
  },
  ecommerce_modern: {
    label: 'E-commerce Modern',
    description: 'E-commerce modern',
    primaryColor: '#3b82f6',
    compatibleStyles: ['modern_light', 'corporate_blue', 'minimal_light'],
    incompatibleStyles: ['tech_neon', 'vintage_retro', 'creative_artistic'],
  },
  blog_readable: {
    label: 'Blog Readable',
    description: 'Blog/content readable',
    primaryColor: '#ffffff',
    compatibleStyles: ['minimal_light', 'classic_white', 'modern_light'],
    incompatibleStyles: ['tech_neon', 'creative_colorful', 'vintage_retro'],
  },
  portfolio_showcase: {
    label: 'Portfolio Showcase',
    description: 'Portfolio showcase',
    primaryColor: '#1a1a1a',
    compatibleStyles: ['modern_dark', 'creative_artistic', 'fashion_elegant'],
    incompatibleStyles: ['medical_clean', 'corporate_gray', 'restaurant_warm'],
  },
  custom_authored: {
    label: 'Custom Authored',
    description: 'Custom authored styles',
    primaryColor: '#6366f1',
    compatibleStyles: [], // Compatible with all
    incompatibleStyles: [], // No restrictions
  },
};

/**
 * Get style label for display
 */
export function getStyleLabel(style: ComponentStyle): string {
  return STYLE_METADATA[style]?.label || style;
}

/**
 * Check if two styles are compatible
 */
export function areStylesCompatible(style1: ComponentStyle, style2: ComponentStyle): boolean {
  if (style1 === 'custom_authored' || style2 === 'custom_authored') {
    return true; // Custom authored is compatible with all
  }
  return STYLE_METADATA[style1]?.compatibleStyles.includes(style2) ?? false;
}


