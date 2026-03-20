import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import lz from 'lzutf8';

export const runtime = 'nodejs';

// Map interactive block IDs to Tron component resolvedNames
const BLOCK_TO_COMPONENT: Record<string, { resolvedName: string; defaultProps: Record<string, unknown> }> = {
  header: {
    resolvedName: 'HeaderTron',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      logoText: 'BRAND', showCta: true, ctaText: 'Get Started', ctaHref: '#', ctaHrefType: 'external',
      sticky: true, animationType: 'none', animateDelay: '0', showThemeToggle: false,
      navLinks: [
        { label: 'Features', href: '#features', type: 'section' },
        { label: 'About', href: '#about', type: 'section' },
        { label: 'Contact', href: '#contact', type: 'section' },
      ],
    },
  },
  hero: {
    resolvedName: 'HeroTron',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 100, showGrid: true, spotlightIntensity: 15,
      showBadge: true, badge: '✦ Welcome',
      headline: 'Your Business Name', subheadline: 'Professional website in minutes',
      subtitle: 'Built with I AM RUNNING platform',
      primaryCta: 'Get Started', primaryCtaHref: '#', primaryCtaHrefType: 'external',
      secondaryCta: 'Learn More', secondaryCtaHref: '#about', secondaryCtaHrefType: 'section',
      showSecondaryCta: true, showSocialProof: false,
      animationType: 'none', animateDelay: '0',
    },
  },
  about: {
    resolvedName: 'TronAbout',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 80, showGrid: true, spotlightIntensity: 10,
      title: 'About Us', subtitle: 'Our Story',
      description: 'We are dedicated to providing the best service in the industry.',
      secondaryDescription: 'With years of experience and a passion for excellence, we deliver results that exceed expectations.',
      showImage: true, imagePosition: 'right', showCta: true, ctaText: 'Learn more', ctaHref: '#',
      showStats: true,
      stats: [
        { value: '500+', label: 'Happy clients' },
        { value: '98%', label: 'Satisfaction' },
        { value: '24/7', label: 'Support' },
        { value: '10+', label: 'Years' },
      ],
      animationType: 'none', animateDelay: '0',
    },
  },
  features: {
    resolvedName: 'TronFeatures',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 80, showGrid: true,
      title: 'Our Features', subtitle: 'What we offer',
      animationType: 'none', animateDelay: '0',
    },
  },
  portfolio: {
    resolvedName: 'TronPortfolio',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 80, showGrid: true,
      title: 'Our Work', subtitle: 'Portfolio',
      animationType: 'none', animateDelay: '0',
    },
  },
  stats: {
    resolvedName: 'TronStats',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 60, showGrid: true,
      animationType: 'none', animateDelay: '0',
    },
  },
  testimonials: {
    resolvedName: 'TronTestimonials',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 80, showGrid: true,
      title: 'Testimonials', subtitle: 'What our clients say',
      animationType: 'none', animateDelay: '0',
    },
  },
  pricing: {
    resolvedName: 'TronPricing',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 80, showGrid: true,
      title: 'Pricing', subtitle: 'Choose your plan',
      animationType: 'none', animateDelay: '0',
    },
  },
  faq: {
    resolvedName: 'TronFAQ',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 80, showGrid: true,
      title: 'FAQ', subtitle: 'Frequently asked questions',
      animationType: 'none', animateDelay: '0',
    },
  },
  contact: {
    resolvedName: 'TronContact',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      sectionHeight: 80, showGrid: true,
      title: 'Contact Us', subtitle: 'Get in touch',
      animationType: 'none', animateDelay: '0',
    },
  },
  footer: {
    resolvedName: 'TronFooter',
    defaultProps: {
      colorScheme: 'dark', accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff',
      showGrid: false,
      brandName: 'BRAND', brandDescription: 'Built with I AM RUNNING',
      animationType: 'none', animateDelay: '0',
    },
  },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 12);
}

function buildCraftJson(blocks: string[], companyName: string, style: string): string {
  const isDark = style !== 'light';
  const craftNodes: Record<string, unknown> = {};
  const childIds: string[] = [];

  for (const blockId of blocks) {
    const mapping = BLOCK_TO_COMPONENT[blockId];
    if (!mapping) continue;

    const nodeId = generateId();
    childIds.push(nodeId);

    // Override company name in relevant props
    const props = { ...mapping.defaultProps };
    if (blockId === 'hero') {
      props.headline = companyName || 'Your Business';
      props.colorScheme = isDark ? 'dark' : 'light';
    } else if (blockId === 'header') {
      props.logoText = companyName || 'BRAND';
      props.colorScheme = isDark ? 'dark' : 'light';
    } else if (blockId === 'footer') {
      props.brandName = companyName || 'BRAND';
      props.colorScheme = isDark ? 'dark' : 'light';
    } else {
      (props as Record<string, unknown>).colorScheme = isDark ? 'dark' : 'light';
    }

    craftNodes[nodeId] = {
      type: { resolvedName: mapping.resolvedName },
      isCanvas: false,
      props,
      displayName: mapping.resolvedName,
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: 'ROOT',
    };
  }

  // ROOT container
  craftNodes['ROOT'] = {
    type: { resolvedName: 'Container' },
    isCanvas: true,
    props: {
      background: 'var(--palette-bg, #ffffff)',
      padding: 0,
      margin: 0,
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: 0,
      flexWrap: 'nowrap',
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#e5e7eb',
      shadow: 'none',
      style: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    },
    displayName: 'Container',
    custom: {},
    hidden: false,
    nodes: childIds,
    linkedNodes: {},
  };

  return JSON.stringify(craftNodes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessType, style, blocks, companyName } = body;

    if (!businessType || !style || !blocks || !Array.isArray(blocks) || blocks.length < 3) {
      return NextResponse.json({ error: 'Invalid contract' }, { status: 400 });
    }

    // Build Craft.js JSON
    const craftJson = buildCraftJson(blocks, companyName || 'My Website', style);
    const compressed = lz.compress(craftJson, { outputEncoding: 'Base64' }) as string;

    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Authenticated: save to Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: companyName || 'My Website',
          description: `${businessType} - ${style} style`,
          source: 'interactive',
          data: {
            craft: {
              schemaVersion: 2,
              pages: [{
                id: 'page-1',
                name: 'Home',
                slug: 'home',
                data: compressed,
                desktopData: compressed,
                mobileData: null,
              }],
              activePageId: 'page-1',
            },
          },
        })
        .select('id')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        projectId: data.id,
        redirect: `/editor?id=${data.id}`,
        craftJson: compressed,
      });
    } else {
      // Anonymous: return compressed JSON for preview
      return NextResponse.json({
        success: true,
        projectId: null,
        craftJson: compressed,
        requiresAuth: true,
      });
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
