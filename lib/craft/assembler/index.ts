/**
 * Assembler: maps Interactive block IDs to Tron components.
 * Used by Interactive page to build Craft.js node trees.
 */
import React from 'react';
import { HeaderTron } from '../components/HeaderTron';
import { HeroTron } from '../components/HeroTron';
import { TronFeatures } from '../components/TronFeatures';
import { TronAbout } from '../components/TronAbout';
import { TronPortfolio } from '../components/TronPortfolio';
import { TronTestimonials } from '../components/TronTestimonials';
import { TronPricing } from '../components/TronPricing';
import { TronFAQ } from '../components/TronFAQ';
import { TronContact } from '../components/TronContact';
import { TronStats } from '../components/TronStats';
import { TronFooter } from '../components/TronFooter';

// Map Interactive block IDs → Tron component + default props
const BLOCK_MAP: Record<string, { component: React.ComponentType<any>; props?: Record<string, any> }> = {
  header:       { component: HeaderTron },
  hero:         { component: HeroTron, props: { showGrid: true, spotlightIntensity: 15 } },
  about:        { component: TronAbout },
  services:     { component: TronFeatures },  // TronServices not yet built, use Features
  features:     { component: TronFeatures },
  portfolio:    { component: TronPortfolio },
  stats:        { component: TronStats },
  testimonials: { component: TronTestimonials },
  pricing:      { component: TronPricing },
  faq:          { component: TronFAQ },
  contact:      { component: TronContact },
  footer:       { component: TronFooter },
};

export interface InteractiveContract {
  businessType: string;
  style: string;
  blocks: string[];
  companyName: string;
}

/**
 * Given a contract from Interactive, returns an array of React elements
 * ready to be added to Craft.js canvas via parseReactElement().
 */
export function buildElementsFromContract(contract: InteractiveContract): React.ReactElement[] {
  const colorScheme = contract.style === 'light' || contract.style === 'minimal' ? 'light' : 'dark';
  const accentColor = '#FF6B35';

  // Enforce fixed ordering: header → hero → middle blocks (in user selection order) → footer
  const selected = new Set(contract.blocks);
  const middleBlocks = contract.blocks.filter(id => id !== 'header' && id !== 'hero' && id !== 'footer');
  const orderedBlocks = [
    ...(selected.has('header') ? ['header'] : []),
    ...(selected.has('hero')   ? ['hero']   : []),
    ...middleBlocks,
    ...(selected.has('footer') ? ['footer'] : []),
  ];

  return orderedBlocks
    .filter(blockId => BLOCK_MAP[blockId])
    .map(blockId => {
      const { component, props = {} } = BLOCK_MAP[blockId];
      return React.createElement(component, {
        ...props,
        colorScheme,
        accentColor,
      });
    });
}
