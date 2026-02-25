import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';
import { HeaderTron } from '../components/HeaderTron';
import { HeroTron } from '../components/HeroTron';
import { TronFeatures } from '../components/TronFeatures';
import { TronPortfolio } from '../components/TronPortfolio';
import { TronTestimonials } from '../components/TronTestimonials';
import { TronPricing } from '../components/TronPricing';
import { TronFAQ } from '../components/TronFAQ';
import { TronContact } from '../components/TronContact';
import { TronFooter } from '../components/TronFooter';
import { SectionBlock, LayoutBlock, PricingCardBlock } from '../components/blocks';

export const PRESETS = [
  {
    id: 'dark-launch',
    name: 'Dark Launch',
    description: 'Modern dark landing page',
    thumbnail: '🚀',
    category: 'Business',
    getElements: () => [
      React.createElement(Header, {
        bgColor: '#0f172a',
        sticky: true,
      }),
      React.createElement(Hero, {
        title: 'Build something',
        titleAccent: 'people love',
        subtitle:
          'Create modern landing pages and websites in minutes. No code required.',
        primaryBtnText: 'Get started',
        secondaryBtnText: 'Learn more',
        badgeText: '✦ New Platform Launch',
        socialProofText: '2,000+ businesses already running',
        gradientFrom: '#0f172a',
        gradientTo: '#1e1b4b',
        minHeight: 600,
        animationType: 'fade-in',
      }),
      React.createElement(Features, {
        bgColor: '#0f172a',
        columns: 3,
        gap: 32,
      }),
      React.createElement(CTA, {
        bgColor: 'linear-gradient(135deg, #FF6B35 0%, #f59e0b 100%)',
      }),
      React.createElement(Footer, {
        bgColor: '#0a0f1e',
      }),
    ],
  },
  {
    id: 'tron',
    name: 'Tron',
    description: 'Dark neon landing with spotlight hero and carousel',
    thumbnail: '◇',
    category: 'Tech',
    getElements: () => [
      React.createElement(HeaderTron, { accentColor: '#e11d48' }),
      React.createElement(HeroTron, { accentColor: '#e11d48', showGrid: true, spotlightIntensity: 0.12 }),
      React.createElement(TronFeatures, { accentColor: '#e11d48' }),
      React.createElement(TronPortfolio, { accentColor: '#e11d48' }),
      React.createElement(TronTestimonials, { accentColor: '#e11d48' }),
      React.createElement(TronPricing, { accentColor: '#e11d48' }),
      React.createElement(TronFAQ, { accentColor: '#e11d48' }),
      React.createElement(TronContact, { accentColor: '#e11d48' }),
      React.createElement(TronFooter, { accentColor: '#e11d48' }),
    ],
  },
  {
    id: 'pricing-cic',
    name: 'Pricing (CiC)',
    description: 'Container-in-Container pricing section with resizable cards',
    thumbnail: '💰',
    category: 'Tech',
    getElements: () => [
      React.createElement(
        SectionBlock,
        {
          blockType: 'pricing',
          sectionHeight: 75,
          showGrid: true,
        },
        React.createElement(
          LayoutBlock,
          { columns: 3, gap: 24 },
          React.createElement(PricingCardBlock, {
            name: 'Starter',
            price: '29',
            period: '/mo',
            description: 'For individuals',
            features: ['Feature 1', 'Feature 2'],
            highlighted: false,
            ctaText: 'Get Started',
            width: 300,
            minHeight: 400,
          }),
          React.createElement(PricingCardBlock, {
            name: 'Pro',
            price: '79',
            period: '/mo',
            description: 'For growing teams',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            highlighted: true,
            ctaText: 'Get Started',
            width: 300,
            minHeight: 400,
          }),
          React.createElement(PricingCardBlock, {
            name: 'Enterprise',
            price: '199',
            period: '/mo',
            description: 'For large organizations',
            features: ['Everything in Pro', 'Priority support', 'Custom SLA'],
            highlighted: false,
            ctaText: 'Contact us',
            width: 300,
            minHeight: 400,
          })
        )
      ),
    ],
  },
];
