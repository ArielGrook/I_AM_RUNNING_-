/**
 * DEFINITIVE TAG SYSTEM
 * 
 * Comprehensive but finite tag system for component categorization.
 * This ensures clean database structure and enables powerful filtering/search.
 * 
 * CRITICAL: All component saves MUST use only these predefined tags.
 * No custom/free-text tag entry allowed (except for special cases).
 */

/**
 * Functional Tags - Describe component behavior/functionality
 */
export const FUNCTIONAL_TAGS = [
  'navigation',
  'sticky',
  'dropdown',
  'responsive',
  'animated',
  'hero_banner',
  'call_to_action',
  'testimonials',
  'pricing',
  'contact_form',
  'newsletter',
  'search',
  'social_links',
  'gallery',
  'carousel',
  'video_embed',
  'map_embed',
  'cart',
  'checkout',
  'payment',
  'user_auth',
] as const;

export type FunctionalTag = typeof FUNCTIONAL_TAGS[number];

/**
 * Smart Navigation Tags - Auto-detect and populate navigation properties
 * These tags enable intelligent routing and link management
 */
export const SMART_NAVIGATION_TAGS = [
  'smart_home',      // Links to home page
  'smart_about',     // Links to about page
  'smart_services',  // Links to services page
  'smart_contact',   // Links to contact page
  'smart_shop',       // Links to shop/catalog
  'smart_blog',       // Links to blog/news
  'smart_portfolio',  // Links to portfolio
  'smart_external',  // External links
] as const;

export type SmartNavigationTag = typeof SMART_NAVIGATION_TAGS[number];

/**
 * Style Tags - Visual/style characteristics
 */
export const STYLE_TAGS = [
  'gradient',
  'shadow',
  'rounded',
  'sharp',
  'transparent',
  'fullwidth',
  'centered',
  'sidebar',
  'grid',
  'flexbox',
] as const;

export type StyleTag = typeof STYLE_TAGS[number];

/**
 * Industry Tags - Industry/domain specific
 */
export const INDUSTRY_TAGS = [
  'medical',
  'restaurant',
  'fashion',
  'tech',
  'corporate',
  'creative',
  'blog',
  'ecommerce',
  'portfolio',
  'education',
] as const;

export type IndustryTag = typeof INDUSTRY_TAGS[number];

/**
 * All valid tags combined
 */
export type ComponentTag = FunctionalTag | SmartNavigationTag | StyleTag | IndustryTag;

export const ALL_TAGS = [
  ...FUNCTIONAL_TAGS,
  ...SMART_NAVIGATION_TAGS,
  ...STYLE_TAGS,
  ...INDUSTRY_TAGS,
] as const;

/**
 * Tag metadata for UI display and filtering
 */
export const TAG_METADATA: Record<ComponentTag, {
  label: string;
  description: string;
  category: 'functional' | 'navigation' | 'style' | 'industry';
  icon?: string;
}> = {
  // Functional Tags
  navigation: { label: 'Navigation', description: 'Navigation component', category: 'functional' },
  sticky: { label: 'Sticky', description: 'Sticky/fixed positioning', category: 'functional' },
  dropdown: { label: 'Dropdown', description: 'Dropdown menu', category: 'functional' },
  responsive: { label: 'Responsive', description: 'Responsive design', category: 'functional' },
  animated: { label: 'Animated', description: 'Has animations', category: 'functional' },
  hero_banner: { label: 'Hero Banner', description: 'Hero section/banner', category: 'functional' },
  call_to_action: { label: 'Call to Action', description: 'CTA button/section', category: 'functional' },
  testimonials: { label: 'Testimonials', description: 'Testimonials section', category: 'functional' },
  pricing: { label: 'Pricing', description: 'Pricing table/section', category: 'functional' },
  contact_form: { label: 'Contact Form', description: 'Contact form', category: 'functional' },
  newsletter: { label: 'Newsletter', description: 'Newsletter signup', category: 'functional' },
  search: { label: 'Search', description: 'Search functionality', category: 'functional' },
  social_links: { label: 'Social Links', description: 'Social media links', category: 'functional' },
  gallery: { label: 'Gallery', description: 'Image gallery', category: 'functional' },
  carousel: { label: 'Carousel', description: 'Carousel/slider', category: 'functional' },
  video_embed: { label: 'Video Embed', description: 'Video embed', category: 'functional' },
  map_embed: { label: 'Map Embed', description: 'Map embed', category: 'functional' },
  cart: { label: 'Cart', description: 'Shopping cart', category: 'functional' },
  checkout: { label: 'Checkout', description: 'Checkout process', category: 'functional' },
  payment: { label: 'Payment', description: 'Payment processing', category: 'functional' },
  user_auth: { label: 'User Auth', description: 'User authentication', category: 'functional' },
  
  // Smart Navigation Tags
  smart_home: { label: 'Home Link', description: 'Links to home page', category: 'navigation', icon: '🏠' },
  smart_about: { label: 'About Link', description: 'Links to about page', category: 'navigation', icon: 'ℹ️' },
  smart_services: { label: 'Services Link', description: 'Links to services page', category: 'navigation', icon: '🛠️' },
  smart_contact: { label: 'Contact Link', description: 'Links to contact page', category: 'navigation', icon: '📧' },
  smart_shop: { label: 'Shop Link', description: 'Links to shop/catalog', category: 'navigation', icon: '🛒' },
  smart_blog: { label: 'Blog Link', description: 'Links to blog/news', category: 'navigation', icon: '📝' },
  smart_portfolio: { label: 'Portfolio Link', description: 'Links to portfolio', category: 'navigation', icon: '🎨' },
  smart_external: { label: 'External Link', description: 'External links', category: 'navigation', icon: '🔗' },
  
  // Style Tags
  gradient: { label: 'Gradient', description: 'Uses gradients', category: 'style' },
  shadow: { label: 'Shadow', description: 'Has shadows', category: 'style' },
  rounded: { label: 'Rounded', description: 'Rounded corners', category: 'style' },
  sharp: { label: 'Sharp', description: 'Sharp edges', category: 'style' },
  transparent: { label: 'Transparent', description: 'Transparent background', category: 'style' },
  fullwidth: { label: 'Full Width', description: 'Full width layout', category: 'style' },
  centered: { label: 'Centered', description: 'Centered layout', category: 'style' },
  sidebar: { label: 'Sidebar', description: 'Has sidebar', category: 'style' },
  grid: { label: 'Grid', description: 'Grid layout', category: 'style' },
  flexbox: { label: 'Flexbox', description: 'Flexbox layout', category: 'style' },
  
  // Industry Tags
  medical: { label: 'Medical', description: 'Medical/healthcare', category: 'industry' },
  restaurant: { label: 'Restaurant', description: 'Restaurant/food', category: 'industry' },
  fashion: { label: 'Fashion', description: 'Fashion/beauty', category: 'industry' },
  tech: { label: 'Tech', description: 'Technology', category: 'industry' },
  corporate: { label: 'Corporate', description: 'Corporate/business', category: 'industry' },
  creative: { label: 'Creative', description: 'Creative/design', category: 'industry' },
  blog: { label: 'Blog', description: 'Blog/content', category: 'industry' },
  ecommerce: { label: 'E-commerce', description: 'E-commerce', category: 'industry' },
  portfolio: { label: 'Portfolio', description: 'Portfolio/showcase', category: 'industry' },
  education: { label: 'Education', description: 'Education', category: 'industry' },
};

/**
 * Get tag label for display
 */
export function getTagLabel(tag: ComponentTag): string {
  return TAG_METADATA[tag]?.label || tag;
}

/**
 * Get tags by category
 */
export function getTagsByCategory(category: 'functional' | 'navigation' | 'style' | 'industry'): ComponentTag[] {
  return ALL_TAGS.filter(tag => TAG_METADATA[tag]?.category === category) as ComponentTag[];
}

/**
 * Check if tag is a smart navigation tag
 */
export function isSmartNavigationTag(tag: string): tag is SmartNavigationTag {
  return SMART_NAVIGATION_TAGS.includes(tag as SmartNavigationTag);
}

/**
 * Get route path for smart navigation tag
 */
export function getSmartNavigationRoute(tag: SmartNavigationTag): string {
  const routeMap: Record<SmartNavigationTag, string> = {
    smart_home: '/',
    smart_about: '/about',
    smart_services: '/services',
    smart_contact: '/contact',
    smart_shop: '/shop',
    smart_blog: '/blog',
    smart_portfolio: '/portfolio',
    smart_external: '#', // External links handled separately
  };
  return routeMap[tag] || '/';
}




