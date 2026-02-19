import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';

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
];
