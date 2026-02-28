'use client';

import { useState, useEffect, useRef } from 'react';
import { Editor, Frame } from '@craftjs/core';
import lz from 'lzutf8';
import {
  Container,
  Text,
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
  data?: {
    accentColor?: string;
    craft?: {
      pages?: Array<{
        id: string;
        name: string;
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

export function SiteRenderer({ project }: { project: Project }) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const pages = project.data?.craft?.pages ?? [];
  const firstPage = pages[0];
  const compressedData = firstPage?.desktopData ?? firstPage?.data ?? '';

  let craftJson = '{}';
  if (compressedData && typeof compressedData === 'string') {
    try {
      craftJson = lz.decompress(compressedData, { inputEncoding: 'Base64' }) as string;
    } catch {
      craftJson = '{}';
    }
  }

  const accentColor = extractAccentColor(craftJson);
  const spotlightIntensity = extractSpotlightIntensity(craftJson);

  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>(extractColorScheme(craftJson));
  const [frameKey, setFrameKey] = useState(0);
  const [activeCraftJson, setActiveCraftJson] = useState(craftJson);
  const [language, setLanguage] = useState('en');

  const headerSettings = extractHeaderSettings(craftJson);

  function toggleTheme() {
    const next = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(next);
    setActiveCraftJson(applyColorScheme(craftJson, next));
    setFrameKey((k) => k + 1);
  }

  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches);
  }, []);

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
      } catch (e) {
        console.error('[GSAP] Error:', e);
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
      }}
    >
      <Editor resolver={resolver} enabled={false}>
        <ThemeProvider initialTheme={{ accentColor, colorScheme }}>
          <Frame key={frameKey} data={activeCraftJson} />
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
