/**
 * F03 Sync Script: Render React library components to static HTML and upsert into Supabase.
 *
 * Usage: npm run sync-components
 *
 * This script:
 * 1. Imports each React component from components/library/
 * 2. Renders it to static HTML with renderToStaticMarkup (strips event handlers)
 * 3. Extracts Tailwind CSS classes from the rendered HTML
 * 4. Upserts the row into the existing Supabase `components` table
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { createClient } from '@supabase/supabase-js'
import * as React from 'react'

// Import library components
import { Header1 } from '../components/library/headers'
import { Hero1 } from '../components/library/heroes'
import { ProductCard1 } from '../components/library/products'
import { Cart1 } from '../components/library/carts'
import { Footer1 } from '../components/library/footers'

// ---------- Config ----------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------- Component Definitions ----------

interface ComponentDef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>
  metadata: {
    name: string
    slug: string
    category: string
    component_path: string
    description: string
    tags: string[]
    style: string
    animation_preset: string
    has_mobile_variant: boolean
    accessibility_score: number
    is_public: boolean
  }
}

const components: ComponentDef[] = [
  {
    Component: Header1,
    metadata: {
      name: 'Modern Header',
      slug: 'header-1',
      category: 'header',
      component_path: 'headers/Header1',
      description: 'Mobile-first e-commerce navigation header with sticky positioning and cart CTA',
      tags: ['ecommerce', 'navigation', 'minimal', 'sticky'],
      style: 'ecommerce_modern',
      animation_preset: 'smooth-fade',
      has_mobile_variant: true,
      accessibility_score: 95,
      is_public: true,
    },
  },
  {
    Component: Hero1,
    metadata: {
      name: 'Hero with CTA',
      slug: 'hero-1',
      category: 'hero',
      component_path: 'heroes/Hero1',
      description: 'Full-width hero section with heading, subtitle, dual CTAs, and image placeholder',
      tags: ['ecommerce', 'hero', 'cta', 'gradient'],
      style: 'ecommerce_modern',
      animation_preset: 'smooth-fade',
      has_mobile_variant: true,
      accessibility_score: 90,
      is_public: true,
    },
  },
  {
    Component: ProductCard1,
    metadata: {
      name: 'Product Card',
      slug: 'product-card-1',
      category: 'product-card',
      component_path: 'products/ProductCard1',
      description: 'E-commerce product card with image, star rating, price, and add-to-cart button',
      tags: ['ecommerce', 'product', 'card', 'rating'],
      style: 'ecommerce_modern',
      animation_preset: 'smooth-fade',
      has_mobile_variant: true,
      accessibility_score: 92,
      is_public: true,
    },
  },
  {
    Component: Cart1,
    metadata: {
      name: 'Shopping Cart',
      slug: 'cart-1',
      category: 'cart',
      component_path: 'carts/Cart1',
      description: 'Shopping cart with quantity controls, order summary, and checkout button',
      tags: ['ecommerce', 'cart', 'checkout'],
      style: 'ecommerce_modern',
      animation_preset: 'smooth-fade',
      has_mobile_variant: true,
      accessibility_score: 93,
      is_public: true,
    },
  },
  {
    Component: Footer1,
    metadata: {
      name: 'Footer Links',
      slug: 'footer-1',
      category: 'footer',
      component_path: 'footers/Footer1',
      description: 'Multi-column footer with shop links, support links, social icons, and copyright',
      tags: ['footer', 'links', 'social', 'copyright'],
      style: 'ecommerce_modern',
      animation_preset: 'smooth-fade',
      has_mobile_variant: true,
      accessibility_score: 94,
      is_public: true,
    },
  },
]

// ---------- Helpers ----------

/** Extract all CSS class names from rendered HTML */
function extractTailwindClasses(html: string): string[] {
  const classRegex = /class="([^"]*)"/g
  const classes = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = classRegex.exec(html)) !== null) {
    match[1].split(/\s+/).forEach((cls) => {
      if (cls) classes.add(cls)
    })
  }

  return Array.from(classes).sort()
}

// ---------- Main ----------

async function syncComponents() {
  console.log('--- F03 Component Sync ---\n')

  let successCount = 0
  let errorCount = 0

  for (const { Component, metadata } of components) {
    try {
      console.log(`Processing: ${metadata.name} (${metadata.slug})`)

      // 1. Render to static HTML
      const html = renderToStaticMarkup(React.createElement(Component))
      console.log(`  Rendered to HTML (${html.length} chars)`)

      // 2. Extract Tailwind classes
      const tailwindClasses = extractTailwindClasses(html)
      console.log(`  Extracted ${tailwindClasses.length} CSS classes`)

      // 3. Build upsert payload matching existing table schema
      const payload = {
        name: metadata.name,
        slug: metadata.slug,
        category: metadata.category,
        component_path: metadata.component_path,
        html,
        css: '',  // Tailwind only; no separate CSS needed
        js: '',
        description: metadata.description,
        tags: metadata.tags,
        style: metadata.style,
        style_tags: tailwindClasses,
        business_tags: ['ecommerce'],
        feature_tags: ['mobile-first', 'responsive', 'animated', 'accessible'],
        animation_preset: metadata.animation_preset,
        has_mobile_variant: metadata.has_mobile_variant,
        accessibility_score: metadata.accessibility_score,
        is_public: metadata.is_public,
        is_premium: false,
        updated_at: new Date().toISOString(),
      }

      // 4. Upsert (conflict on slug)
      const { error } = await supabase
        .from('components')
        .upsert(payload, { onConflict: 'slug' })

      if (error) {
        console.error(`  ERROR: ${error.message}`)
        errorCount++
      } else {
        console.log(`  Synced to Supabase`)
        successCount++
      }

      console.log()
    } catch (err) {
      console.error(`  FATAL: Failed to process ${metadata.name}:`, err)
      errorCount++
    }
  }

  console.log('--- Summary ---')
  console.log(`  Success: ${successCount}/${components.length}`)
  if (errorCount > 0) {
    console.log(`  Errors:  ${errorCount}`)
  }
  console.log('Done.\n')
}

syncComponents()
  .catch(console.error)
  .finally(() => process.exit())
