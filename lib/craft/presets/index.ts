import React from 'react';
import { HeaderTron } from '../components/HeaderTron';
import { HeroTron } from '../components/HeroTron';
import { TronFeatures } from '../components/TronFeatures';
import { TronPortfolio } from '../components/TronPortfolio';
import { TronTestimonials } from '../components/TronTestimonials';
import { TronPricing } from '../components/TronPricing';
import { TronFAQ } from '../components/TronFAQ';
import { TronContact } from '../components/TronContact';
import { TronFooter } from '../components/TronFooter';

export const PRESETS = [
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
];
