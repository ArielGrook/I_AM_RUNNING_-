'use client';

import { useState, useEffect } from 'react';
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

export function SiteRenderer({ project }: { project: Project }) {
  const [spotlightPos, setSpotlightPos] = useState({ x: -9999, y: -9999 });

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

  useEffect(() => {
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSpotlightPos({ x: e.clientX, y: e.clientY });
      });
    };
    const handleMouseLeave = () => {
      setSpotlightPos({ x: -9999, y: -9999 });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <Editor resolver={resolver} enabled={false}>
        <ThemeProvider>
          <Frame data={craftJson} />
        </ThemeProvider>
      </Editor>
      {spotlightPos.x >= 0 && spotlightPos.y >= 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            background: `radial-gradient(circle 400px at ${spotlightPos.x}px ${spotlightPos.y}px,
              rgba(${hexToRgb(accentColor)}, 0.12) 0%,
              transparent 70%
            )`,
          }}
        />
      )}
    </>
  );
}
