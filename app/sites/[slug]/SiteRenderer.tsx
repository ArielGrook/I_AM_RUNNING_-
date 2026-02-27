'use client';

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

export function SiteRenderer({ project }: { project: Project }) {
  const pages = project.data?.craft?.pages ?? [];
  const firstPage = pages[0];
  const compressedData = firstPage?.desktopData ?? firstPage?.data;

  let craftJson = '{}';
  if (compressedData && typeof compressedData === 'string') {
    try {
      craftJson = lz.decompress(compressedData, { inputEncoding: 'Base64' }) as string;
    } catch {
      craftJson = '{}';
    }
  }

  return (
    <Editor resolver={resolver} enabled={false}>
      <ThemeProvider>
        <Frame data={craftJson} />
      </ThemeProvider>
    </Editor>
  );
}
