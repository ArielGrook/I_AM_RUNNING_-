/**
 * Smart Navigation Detection
 * 
 * Auto-detect smart navigation tags from HTML content.
 * Analyzes links and suggests appropriate smart navigation tags.
 */

import { SmartNavigationTag, SMART_NAVIGATION_TAGS, isSmartNavigationTag } from '@/lib/constants/tags';

/**
 * Detect smart navigation tags from HTML content
 * 
 * @param html - HTML content to analyze
 * @returns Array of detected smart navigation tags
 */
export function detectSmartNavigation(html: string): SmartNavigationTag[] {
  const detected: SmartNavigationTag[] = [];
  const lowerHtml = html.toLowerCase();
  
  // Pattern matching for common navigation patterns
  // Home links
  if (
    lowerHtml.includes('href="/"') ||
    lowerHtml.includes('href="/home"') ||
    lowerHtml.includes('href="#home"') ||
    lowerHtml.includes('class="home"') ||
    lowerHtml.includes('id="home"') ||
    (lowerHtml.includes('home') && lowerHtml.includes('href'))
  ) {
    detected.push('smart_home');
  }
  
  // About links
  if (
    lowerHtml.includes('href="/about"') ||
    lowerHtml.includes('href="#about"') ||
    lowerHtml.includes('class="about"') ||
    lowerHtml.includes('id="about"') ||
    (lowerHtml.includes('about') && lowerHtml.includes('href'))
  ) {
    detected.push('smart_about');
  }
  
  // Contact links
  if (
    lowerHtml.includes('href="/contact"') ||
    lowerHtml.includes('href="#contact"') ||
    lowerHtml.includes('class="contact"') ||
    lowerHtml.includes('id="contact"') ||
    (lowerHtml.includes('contact') && lowerHtml.includes('href'))
  ) {
    detected.push('smart_contact');
  }
  
  // Services links
  if (
    lowerHtml.includes('href="/services"') ||
    lowerHtml.includes('href="#services"') ||
    lowerHtml.includes('class="services"') ||
    lowerHtml.includes('id="services"') ||
    (lowerHtml.includes('services') && lowerHtml.includes('href'))
  ) {
    detected.push('smart_services');
  }
  
  // Shop links
  if (
    lowerHtml.includes('href="/shop"') ||
    lowerHtml.includes('href="/store"') ||
    lowerHtml.includes('href="/catalog"') ||
    lowerHtml.includes('href="/products"') ||
    lowerHtml.includes('class="shop"') ||
    lowerHtml.includes('class="store"') ||
    (lowerHtml.includes('shop') && lowerHtml.includes('href')) ||
    (lowerHtml.includes('store') && lowerHtml.includes('href'))
  ) {
    detected.push('smart_shop');
  }
  
  // Blog links
  if (
    lowerHtml.includes('href="/blog"') ||
    lowerHtml.includes('href="/news"') ||
    lowerHtml.includes('href="/articles"') ||
    lowerHtml.includes('class="blog"') ||
    lowerHtml.includes('class="news"') ||
    (lowerHtml.includes('blog') && lowerHtml.includes('href')) ||
    (lowerHtml.includes('news') && lowerHtml.includes('href'))
  ) {
    detected.push('smart_blog');
  }
  
  // Portfolio links
  if (
    lowerHtml.includes('href="/portfolio"') ||
    lowerHtml.includes('href="/gallery"') ||
    lowerHtml.includes('href="/work"') ||
    lowerHtml.includes('class="portfolio"') ||
    lowerHtml.includes('class="gallery"') ||
    (lowerHtml.includes('portfolio') && lowerHtml.includes('href')) ||
    (lowerHtml.includes('gallery') && lowerHtml.includes('href'))
  ) {
    detected.push('smart_portfolio');
  }
  
  // External links
  if (
    lowerHtml.includes('href="http') ||
    lowerHtml.includes('href="https') ||
    lowerHtml.includes('target="_blank"') ||
    lowerHtml.includes('rel="external"') ||
    lowerHtml.includes('rel="nofollow"')
  ) {
    detected.push('smart_external');
  }
  
  // Remove duplicates and return
  return [...new Set(detected)];
}

/**
 * Get smart navigation suggestions with confidence
 */
export function getSmartNavigationSuggestions(html: string): Array<{
  tag: SmartNavigationTag;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}> {
  const suggestions: Array<{
    tag: SmartNavigationTag;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }> = [];
  
  const lowerHtml = html.toLowerCase();
  
  // High confidence: exact href match
  if (lowerHtml.includes('href="/"') || lowerHtml.includes('href="/home"')) {
    suggestions.push({
      tag: 'smart_home',
      confidence: 'high',
      reason: 'Found home page link',
    });
  }
  
  if (lowerHtml.includes('href="/about"')) {
    suggestions.push({
      tag: 'smart_about',
      confidence: 'high',
      reason: 'Found about page link',
    });
  }
  
  if (lowerHtml.includes('href="/contact"')) {
    suggestions.push({
      tag: 'smart_contact',
      confidence: 'high',
      reason: 'Found contact page link',
    });
  }
  
  // Medium confidence: class/id match
  if (lowerHtml.includes('class="home"') || lowerHtml.includes('id="home"')) {
    suggestions.push({
      tag: 'smart_home',
      confidence: 'medium',
      reason: 'Found home identifier',
    });
  }
  
  // Low confidence: text content match
  if (lowerHtml.includes('home') && lowerHtml.includes('href')) {
    suggestions.push({
      tag: 'smart_home',
      confidence: 'low',
      reason: 'Possible home link',
    });
  }
  
  return suggestions;
}

/**
 * Check if a tag is a smart navigation tag
 */
export function isSmartTag(tag: string): tag is SmartNavigationTag {
  return isSmartNavigationTag(tag);
}



