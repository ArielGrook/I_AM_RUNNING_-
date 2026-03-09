'use client';

import { useState, useEffect, useRef } from 'react';
import { Editor, Frame } from '@craftjs/core';
import lz from 'lzutf8';
import {
  Container,
  Text,
  Hero,
  HeroTron,
  HeroTronHeading,
  HeroTronSubheading,
  HeroTronButton,
  Button,
  Image,
  HeaderTron,
  TronFeatures,
  FeatureCard,
  TronStats,
  StatItem,
  TronPortfolio,
  TronTestimonials,
  TestimonialCard,
  TronPricing,
  PricingCard,
  TronFAQ,
  FAQItem,
  TronFooter,
  FooterColumn,
  TronContact,
  TronLogin,
  TronRegister,
  TronHub,
  TronShowcase,
  Divider,
  Video,
  HtmlBlock,
  SectionBlock,
  LayoutBlock,
  CardBlock,
  PricingCardBlock,
} from '@/lib/craft/components';
import { ThemeProvider } from '@/lib/craft/context/ThemeContext';
import { SiteContext } from '@/lib/craft/context/SiteContext';

const resolver = {
  Container,
  Text,
  Hero,
  HeroTron,
  HeroTronHeading,
  HeroTronSubheading,
  HeroTronButton,
  Button,
  Image,
  HeaderTron,
  TronFeatures,
  FeatureCard,
  TronStats,
  StatItem,
  TronPortfolio,
  TronTestimonials,
  TestimonialCard,
  TronPricing,
  PricingCard,
  TronFAQ,
  FAQItem,
  TronFooter,
  FooterColumn,
  TronContact,
  TronLogin,
  TronRegister,
  TronHub,
  TronShowcase,
  Divider,
  Video,
  HtmlBlock,
  SectionBlock,
  LayoutBlock,
  CardBlock,
  PricingCardBlock,
};

type Project = {
  id: string;
  slug?: string;
  data?: {
    accentColor?: string;
    craft?: {
      pages?: Array<{
        id: string;
        name: string;
        slug?: string;
        desktopData?: string;
        mobileData?: string;
        data?: string;
      }>;
    };
  };
};

function hexToRgb(hex: string): string {
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function extractColorScheme(craftData: string): 'dark' | 'light' {
  try {
    const parsed = JSON.parse(craftData) as Record<string, unknown>;
    const nodes = Object.values(parsed) as Array<{ props?: { colorScheme?: string } }>;
    for (const node of nodes) {
      if (node?.props?.colorScheme === 'light' || node?.props?.colorScheme === 'dark') {
        return node.props.colorScheme;
      }
    }
  } catch {
    // noop
  }
  return 'dark';
}

function extractAccentColor(craftData: string): string {
  try {
    const parsed = JSON.parse(craftData) as Record<string, unknown>;
    const nodesObj = (parsed?.nodes ?? parsed) as Record<string, { props?: { accentColor?: string } }>;
    const nodes = Object.values(nodesObj ?? {});
    for (const node of nodes) {
      if (node?.props?.accentColor) return node.props.accentColor;
    }
  } catch {
    // noop
  }
  return '#FF6B35';
}

function extractSpotlightIntensity(craftData: string): number {
  try {
    const parsed = JSON.parse(craftData) as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes = Object.values(parsed) as any[];
    for (const node of nodes) {
      if (node?.props?.spotlightIntensity != null) {
        return Number(node.props.spotlightIntensity);
      }
    }
  } catch {
    // noop
  }
  return 15;
}

function applyColorScheme(craftData: string, scheme: 'dark' | 'light'): string {
  try {
    const parsed = JSON.parse(craftData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(parsed).forEach((node: any) => {
      if (node?.props && 'colorScheme' in node.props) {
        node.props.colorScheme = scheme;
      }
    });
    return JSON.stringify(parsed);
  } catch {
    return craftData;
  }
}

function extractHeaderSettings(craftData: string) {
  try {
    const parsed = JSON.parse(craftData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes = Object.values(parsed) as any[];
    for (const node of nodes) {
      if (node?.type?.resolvedName === 'HeaderTron') {
        return {
          showThemeToggle: node.props?.showThemeToggle ?? false,
          showLanguageToggle: node.props?.showLanguageToggle ?? false,
          availableLanguages: node.props?.availableLanguages ?? ['en'],
        };
      }
    }
  } catch {
    // noop
  }
  return { showThemeToggle: false, showLanguageToggle: false, availableLanguages: ['en'] };
}

type PageType = {
  id: string;
  name: string;
  slug?: string;
  desktopData?: string;
  mobileData?: string;
  data?: string;
};

function decompressPage(page: PageType | undefined): string {
  if (!page) return '{}';
  const compressedData = page.desktopData ?? page.data ?? '';
  if (!compressedData) return '{}';
  try {
    return lz.decompress(compressedData, { inputEncoding: 'Base64' }) as string;
  } catch {
    return '{}';
  }
}

export function SiteRenderer({ project, initialPageSlug }: { project: Project; initialPageSlug?: string }) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const pages = project.data?.craft?.pages ?? [];

  const findPage = (pageSlug?: string) => {
    if (!pageSlug) return pages[0];
    return (
      pages.find(
        (p) =>
          p.slug === pageSlug ||
          p.name.toLowerCase().replace(/\s+/g, '-') === pageSlug
      ) ?? pages[0]
    );
  };

  const [activePage, setActivePage] = useState(() => findPage(initialPageSlug));
  const [craftJson, setCraftJson] = useState(() => decompressPage(activePage));

  const accentColor = extractAccentColor(craftJson);
  const spotlightIntensity = extractSpotlightIntensity(craftJson);
  const headerSettings = extractHeaderSettings(craftJson);

  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>(extractColorScheme(craftJson));
  const [frameKey, setFrameKey] = useState(0);
  const [activeCraftJson, setActiveCraftJson] = useState(craftJson);
  const [language, setLanguage] = useState('en');

  function toggleTheme() {
    const next = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(next);
    setActiveCraftJson(applyColorScheme(craftJson, next));
    setFrameKey((k) => k + 1);
  }

  function navigateToPage(pageSlug: string) {
    const page = pages.find(
      (p) =>
        p.slug === pageSlug ||
        p.name.toLowerCase().replace(/\s+/g, '-') === pageSlug
    );
    if (!page) return;
    setIsTransitioning(true);
    setActivePage(page);
    const newCraftJson = decompressPage(page);
    setCraftJson(newCraftJson);
    setActiveCraftJson(applyColorScheme(newCraftJson, colorScheme));
    setFrameKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const projectSlug = project.slug ?? '';
    window.history.pushState({}, '', `/sites/${projectSlug}/${pageSlug}`);
  }

  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ page: string }>;
      const page = customEvent.detail?.page;
      if (page === '__first__') {
        const firstSlug = pages[0]?.slug ?? pages[0]?.name?.toLowerCase().replace(/\s+/g, '-') ?? '';
        if (firstSlug) navigateToPage(firstSlug);
      } else if (page) {
        const targetPage = pages.find(
          (p) =>
            (p.slug ?? '') === page ||
            (p.name ?? '').toLowerCase().replace(/\s+/g, '-') === page
        );
        if (targetPage) {
          navigateToPage(targetPage.slug ?? targetPage.name?.toLowerCase().replace(/\s+/g, '-') ?? page);
        }
      }
    };
    window.addEventListener('iam_navigate', handler);
    return () => window.removeEventListener('iam_navigate', handler);
  }, [pages, colorScheme]);

  useEffect(() => {
    const initAnimations = async () => {
      try {
        const gsapModule = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gsap = (gsapModule as any).gsap || (gsapModule as any).default;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gsap.registerPlugin(ScrollTrigger);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ScrollTrigger as any).getAll().forEach((t: any) => t.kill());

        document.querySelectorAll('[data-animate]').forEach((el) => {
          const htmlEl = el as HTMLElement;
          const animationType = htmlEl.getAttribute('data-animate') || '';
          if (!animationType || animationType === 'none') return;

          const delay = parseFloat(htmlEl.getAttribute('data-animate-delay') || '0');
          const fromVars: Record<string, unknown> = { immediateRender: false };
          const toVars: Record<string, unknown> = { duration: 0.8, delay, ease: 'power2.out' };

          switch (animationType) {
            case 'fade-in':    fromVars.opacity = 0; toVars.opacity = 1; break;
            case 'slide-up':   fromVars.opacity = 0; fromVars.y = 60; toVars.opacity = 1; toVars.y = 0; break;
            case 'slide-down': fromVars.opacity = 0; fromVars.y = -60; toVars.opacity = 1; toVars.y = 0; break;
            case 'slide-left': fromVars.opacity = 0; fromVars.x = -60; toVars.opacity = 1; toVars.x = 0; break;
            case 'blur-in':    fromVars.opacity = 0; fromVars.filter = 'blur(12px)'; toVars.opacity = 1; toVars.filter = 'blur(0px)'; break;
            case 'scale-in':   fromVars.opacity = 0; fromVars.scale = 0.85; toVars.opacity = 1; toVars.scale = 1; break;
            default:           fromVars.opacity = 0; toVars.opacity = 1;
          }

          const rect = htmlEl.getBoundingClientRect();
          const inViewport = rect.top < window.innerHeight * 0.95;

          if (inViewport) {
            gsap.fromTo(htmlEl, fromVars, { ...toVars, delay: 0.2 });
          } else {
            gsap.fromTo(htmlEl, fromVars, {
              ...toVars,
              scrollTrigger: {
                trigger: htmlEl,
                start: 'top 85%',
                toggleActions: 'play none none none',
                once: true,
              },
            });
          }
        });

        document.querySelectorAll('[data-animate-from]').forEach((el) => {
          const htmlEl = el as HTMLElement;
          const from = htmlEl.getAttribute('data-animate-from');
          if (!from || from === 'none') return;
          const fromY = from === 'slide-top' ? -80 : 80;
          gsap.fromTo(
            htmlEl,
            { opacity: 0, y: fromY, immediateRender: false },
            {
              opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
              scrollTrigger: { trigger: htmlEl, start: 'top 88%', once: true },
            }
          );
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ScrollTrigger as any).refresh();
        setIsLoaded(true);
        setIsTransitioning(false);
      } catch (e) {
        console.error('[GSAP] Error:', e);
        setIsLoaded(true);
        setIsTransitioning(false);
      }
    };

    const timer = setTimeout(() => {
      initAnimations();
    }, 300);

    return () => {
      clearTimeout(timer);
      import('gsap/ScrollTrigger').then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m as any).ScrollTrigger?.getAll?.().forEach((t: any) => t.kill());
      });
    };
  }, [frameKey]);

  useEffect(() => {
    const mobile = window.matchMedia('(pointer: coarse)').matches;
    if (mobile) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (spotlightRef.current) {
          spotlightRef.current.style.background = `radial-gradient(circle 400px at ${e.clientX}px ${e.clientY}px,
            rgba(${hexToRgb(accentColor)}, ${spotlightIntensity / 100}) 0%,
            transparent 70%
          )`;
          spotlightRef.current.style.opacity = '1';
        }
      });
    };
    const handleMouseLeave = () => {
      if (spotlightRef.current) spotlightRef.current.style.opacity = '0';
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [accentColor, spotlightIntensity]);

  return (
    <SiteContext.Provider
      value={{
        colorScheme,
        toggleTheme,
        showThemeToggle: headerSettings.showThemeToggle,
        language,
        setLanguage,
        availableLanguages: headerSettings.availableLanguages,
        showLanguageToggle: headerSettings.showLanguageToggle,
        navigateToPage,
        pages: pages.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug ?? p.name.toLowerCase().replace(/\s+/g, '-'),
        })),
        activePageSlug:
          activePage?.slug ?? activePage?.name.toLowerCase().replace(/\s+/g, '-') ?? '',
      }}
    >
      {/* Лоадер */}
      {!isLoaded && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
        }}>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: '#ffffff',
            marginBottom: 32,
            fontFamily: 'system-ui, sans-serif',
          }}>
            I AM RUNNING
          </div>
          <div style={{
            width: 200,
            height: 2,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: accentColor,
              borderRadius: 2,
              animation: 'loaderBar 1.2s ease-in-out infinite',
            }} />
          </div>
          <style>{`
            @keyframes loaderBar {
              0%   { width: 0%;   margin-left: 0%; }
              50%  { width: 60%;  margin-left: 20%; }
              100% { width: 0%;   margin-left: 100%; }
            }
          `}</style>
        </div>
      )}

      <Editor resolver={resolver} enabled={false}>
        <ThemeProvider>
          <div style={{
  opacity: isTransitioning ? 0 : 1,
  transition: 'opacity 0.2s ease',
  minHeight: '100vh',
  background: colorScheme === 'light' ? '#ffffff' : '#0a0a0a',
}}>
            <Frame key={frameKey} data={activeCraftJson} />
          </div>
        </ThemeProvider>
      </Editor>

      {!isMobile && (
        <div
          ref={spotlightRef}
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
    </SiteContext.Provider>
  );
}
