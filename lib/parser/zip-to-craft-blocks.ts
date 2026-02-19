/**
 * Parse a ZIP file into Craft.js HtmlBlock format.
 * Returns blocks array: { blockType, label, rawHtml, rawCss } for each section.
 */

import JSZip from 'jszip';
import { parse, HTMLElement } from 'node-html-parser';

export type CraftBlockType = 'header' | 'hero' | 'section' | 'footer' | 'unknown';

export interface CraftBlock {
  blockType: CraftBlockType;
  label: string;
  rawHtml: string;
  rawCss: string;
}

export interface ParseZipToCraftBlocksResult {
  blocks: CraftBlock[];
}

function getTag(el: HTMLElement): string {
  return (el.tagName || '').toLowerCase();
}

function getClass(el: HTMLElement): string {
  const c = (el as unknown as { classNames?: string[] }).classNames;
  return Array.isArray(c) ? c.join(' ') : (el.getAttribute?.('class') || '');
}

function getId(el: HTMLElement): string {
  return el.getAttribute?.('id') || '';
}

function isHeader(el: HTMLElement): boolean {
  const tag = getTag(el);
  const cls = getClass(el).toLowerCase();
  return tag === 'header' || tag === 'nav' || cls.includes('header') || cls.includes('nav');
}

function isHero(el: HTMLElement): boolean {
  const tag = getTag(el);
  const cls = getClass(el).toLowerCase();
  const id = getId(el).toLowerCase();
  return (
    tag === 'section' && (cls.includes('hero') || id.includes('hero'))
  ) || cls.includes('hero') || id === 'hero';
}

function isFooter(el: HTMLElement): boolean {
  const tag = getTag(el);
  const cls = getClass(el).toLowerCase();
  return tag === 'footer' || cls.includes('footer');
}

function isSectionLike(el: HTMLElement): boolean {
  const tag = getTag(el);
  const cls = getClass(el).toLowerCase();
  return (
    tag === 'section' ||
    tag === 'article' ||
    cls.includes('section') ||
    tag === 'main' ||
    tag === 'div'
  );
}

function getBlockType(el: HTMLElement, index: number, firstSectionIndex: number | null): CraftBlockType {
  if (isHeader(el)) return 'header';
  if (isHero(el)) return 'hero';
  if (index === firstSectionIndex) return 'hero';
  if (isFooter(el)) return 'footer';
  if (isSectionLike(el)) return 'section';
  return 'unknown';
}

function getLabel(el: HTMLElement, blockType: CraftBlockType): string {
  const id = getId(el);
  const cls = getClass(el).trim().split(/\s+/)[0] || '';
  const part = id || cls || '';
  return part ? `${blockType} ${part}` : blockType;
}

function elementToHtml(el: HTMLElement): string {
  if (typeof el.toString === 'function') {
    return el.toString();
  }
  const tag = getTag(el) || 'div';
  const inner = (el as unknown as { innerHTML?: string }).innerHTML || '';
  return `<${tag}>${inner}</${tag}>`;
}

/**
 * Collect all CSS from the HTML document and linked stylesheets in the ZIP.
 */
async function collectCss(
  doc: ReturnType<typeof parse>,
  htmlPath: string,
  zip: JSZip
): Promise<string> {
  const parts: string[] = [];

  // Inline <style> tags
  const styleTags = doc.querySelectorAll('style');
  for (const style of styleTags) {
    const text = (style as HTMLElement).textContent || (style as unknown as { innerHTML?: string }).innerHTML || '';
    if (text.trim()) parts.push(text.trim());
  }

  // <link rel="stylesheet" href="...">
  const baseDir = htmlPath.includes('/') ? htmlPath.replace(/\/[^/]+$/, '/') : '';
  const links = doc.querySelectorAll('link[rel="stylesheet"]');
  for (const link of links) {
    const href = link.getAttribute?.('href');
    if (!href || href.startsWith('http')) continue;
    const resolved = href.startsWith('/') ? href.slice(1) : `${baseDir}${href}`.replace(/\/+/g, '/');
    try {
      const entry = zip.file(resolved) || zip.file(href) || zip.file(resolved.split('/').pop() || '');
      if (entry) {
        const css = await entry.async('string');
        if (css.trim()) parts.push(css.trim());
      }
    } catch {
      // skip failed link
    }
  }

  return parts.join('\n\n');
}

/**
 * Parse ZIP and return blocks for Craft.js HtmlBlock nodes.
 */
export async function parseZipToCraftBlocks(zipBuffer: ArrayBuffer): Promise<ParseZipToCraftBlocksResult> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipBuffer);

  const fileNames = Object.keys(contents.files).filter((p) => !contents.files[p].dir);
  const htmlPath = fileNames.find((p) => /^index\.(html?)$/i.test(p.split('/').pop() || ''))
    || fileNames.find((p) => /\.(html?)$/i.test(p));
  if (!htmlPath) {
    return { blocks: [] };
  }

  const entry = contents.files[htmlPath];
  const htmlContent = await entry.async('string');
  const doc = parse(htmlContent);
  const body = doc.querySelector('body') || doc;

  const allCss = await collectCss(doc, htmlPath, contents);

  const childNodes = (body as unknown as { childNodes?: unknown[] }).childNodes || [];
  const elements: HTMLElement[] = [];
  for (const node of childNodes) {
    const n = node as HTMLElement;
    if (n && typeof n === 'object' && typeof (n as HTMLElement).tagName === 'string') {
      elements.push(n);
    }
  }

  let firstSectionIndex: number | null = null;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (getTag(el) === 'section' && firstSectionIndex === null) {
      firstSectionIndex = i;
      break;
    }
  }

  const blocks: CraftBlock[] = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const blockType = getBlockType(el, i, firstSectionIndex);
    const label = getLabel(el, blockType);
    const rawHtml = elementToHtml(el);
    blocks.push({
      blockType,
      label,
      rawHtml,
      rawCss: allCss,
    });
  }

  return { blocks };
}
