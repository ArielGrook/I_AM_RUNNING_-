/**
 * Screenshot Generation Utilities
 * 
 * Generate screenshots of components using html2canvas.
 * 
 * Stage 2 Module 6: Visual Library
 */

import html2canvas from 'html2canvas';
import { getRedisClient } from '@/lib/redis/client';

const SCREENSHOT_CACHE_PREFIX = 'screenshot:';
const SCREENSHOT_CACHE_TTL = 86400; // 24 hours

/**
 * Generate screenshot from HTML element
 * 
 * @param element - HTML element to capture
 * @param options - html2canvas options
 * @returns Base64 data URL of screenshot
 */
export async function generateScreenshot(
  element: HTMLElement,
  options?: Partial<html2canvas.Options>
): Promise<string> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 1,
      logging: false,
      useCORS: true,
      allowTaint: false,
      ...options,
    });

    return canvas.toDataURL('image/png', 0.9);
  } catch (error) {
    console.error('Failed to generate screenshot:', error);
    throw new Error('Failed to generate screenshot');
  }
}

/**
 * Generate screenshot from HTML string
 * 
 * @param html - HTML content to render
 * @param width - Optional width for container
 * @param height - Optional height for container
 * @returns Base64 data URL of screenshot
 */
export async function generateScreenshotFromHtml(
  html: string,
  width: number = 800,
  height: number = 600
): Promise<string> {
  // Create temporary container
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.innerHTML = html;

  document.body.appendChild(container);

  try {
    const screenshot = await generateScreenshot(container);
    return screenshot;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Get cached screenshot or generate new one
 * 
 * @param key - Cache key (e.g., component ID)
 * @param generator - Function to generate screenshot if not cached
 * @returns Base64 data URL of screenshot
 */
export async function getCachedScreenshot(
  key: string,
  generator: () => Promise<string>
): Promise<string> {
  const cacheKey = `${SCREENSHOT_CACHE_PREFIX}${key}`;
  const redis = getRedisClient();

  try {
    // Try Redis cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Generate new screenshot
    const screenshot = await generator();

    // Cache in Redis
    if (redis) {
      await redis.setex(cacheKey, SCREENSHOT_CACHE_TTL, screenshot);
    }

    return screenshot;
  } catch (error) {
    console.error('Screenshot caching error:', error);
    // Fallback to generator without cache
    return generator();
  }
}

/**
 * Generate screenshot hash for cache key
 */
export function generateScreenshotKey(html: string): string {
  // Simple hash function for HTML content
  let hash = 0;
  for (let i = 0; i < html.length; i++) {
    const char = html.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `html-${Math.abs(hash).toString(36)}`;
}








