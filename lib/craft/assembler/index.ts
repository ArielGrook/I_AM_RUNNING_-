/**
 * Assembler: maps Interactive block IDs to Tron components.
 * Receives full color preset from InteractiveContract.
 */
import React from 'react';
import { HeaderTron } from '../components/HeaderTron';
import { HeroTron } from '../components/HeroTron';
import { TronFeatures } from '../components/TronFeatures';
import { TronAbout } from '../components/TronAbout';
import { TronCTA } from '../components/TronCTA';
import { TronServices } from '../components/TronServices';
import { TronTeam } from '../components/TronTeam';
import { TronPortfolio } from '../components/TronPortfolio';
import { TronTestimonials } from '../components/TronTestimonials';
import { TronPricing } from '../components/TronPricing';
import { TronFAQ } from '../components/TronFAQ';
import { TronContact } from '../components/TronContact';
import { TronStats } from '../components/TronStats';
import { TronFooter } from '../components/TronFooter';

const BLOCK_MAP: Record<string, { component: React.ComponentType<any>; extraProps?: Record<string, any> }> = {
  header:       { component: HeaderTron },
  hero:         { component: HeroTron, extraProps: { showGrid: true, spotlightIntensity: 15 } },
  about:        { component: TronAbout },
  team:         { component: TronTeam },
  cta:          { component: TronCTA },
  services:     { component: TronServices },
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
  // Color preset fields
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
}

export function buildElementsFromContract(contract: InteractiveContract): React.ReactElement[] {
  const colorScheme: 'dark' | 'light' = contract.style === 'light' ? 'light' : 'dark';
  const accentColor = contract.accentColor ?? '#FF6B35';
  const darkBg = contract.darkBg ?? '#0a0a0a';
  const lightBg = contract.lightBg ?? '#ffffff';

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
      const { component, extraProps = {} } = BLOCK_MAP[blockId];
      return React.createElement(component, {
        ...extraProps,
        colorScheme,
        accentColor,
        darkBg,
        lightBg,
      });
    });
}
