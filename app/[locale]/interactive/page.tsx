'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import lz from 'lzutf8';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { buildElementsFromContract, InteractiveContract } from '@/lib/craft/assembler';

import {
  Container,
  HeroTron, HeroTronHeading, HeroTronSubheading, HeroTronButton,
  HeaderTron, TronFeatures, FeatureCard, TronStats, TronAbout, TronCTA, TronServices, TronTeam, StatItem,
  TronPortfolio, TronTestimonials, TestimonialCard, TronPricing, PricingCard,
  TronFAQ, FAQItem, TronFooter, FooterColumn, TronContact, TronShowcase,
  TronLogin, TronRegister, TronHub, HtmlBlock,
} from '@/lib/craft/components';
import { ThemeProvider } from '@/lib/craft/context/ThemeContext';
import { SiteContext } from '@/lib/craft/context/SiteContext';

const resolver = {
  Container, HeroTron, HeroTronHeading, HeroTronSubheading, HeroTronButton,
  HeaderTron, TronFeatures, FeatureCard, TronStats, TronAbout, TronCTA, TronServices, TronTeam, StatItem,
  TronPortfolio, TronTestimonials, TestimonialCard, TronPricing, PricingCard,
  TronFAQ, FAQItem, TronFooter, FooterColumn, TronContact, TronShowcase,
  TronLogin, TronRegister, TronHub, HtmlBlock,
};

// ── Types ───────────────────────────────────────────────────────────────
interface ContractState {
  businessType: string | null;
  presetId: string | null;
  blocks: string[];
  companyName: string;
  step: number;
}

// ── Business types ──────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'food',          emoji: '🍕', label: 'Restaurant & Food' },
  { id: 'shop',          emoji: '🛍️', label: 'Shop & Retail' },
  { id: 'ecommerce',     emoji: '🛒', label: 'Online Store' },
  { id: 'startup',       emoji: '🚀', label: 'Startup & Tech' },
  { id: 'portfolio',     emoji: '💼', label: 'Portfolio' },
  { id: 'beauty',        emoji: '✨', label: 'Beauty & Spa' },
  { id: 'health',        emoji: '💪', label: 'Health & Fitness' },
  { id: 'education',     emoji: '📚', label: 'Education' },
  { id: 'agency',        emoji: '🏢', label: 'Agency' },
  { id: 'consulting',    emoji: '📊', label: 'Consulting' },
  { id: 'blog',          emoji: '✍️', label: 'Blog' },
  { id: 'event',         emoji: '🎉', label: 'Events' },
  { id: 'real_estate',   emoji: '🏠', label: 'Real Estate' },
  { id: 'travel',        emoji: '✈️', label: 'Travel' },
  { id: 'craft',         emoji: '🎨', label: 'Art & Craft' },
  { id: 'business_card', emoji: '📇', label: 'Business Card' },
];

// ── Color presets ───────────────────────────────────────────────────────
interface ColorPreset {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  darkBg: string;
  lightBg: string;
  colorScheme: 'dark' | 'light';
}

const COLOR_PRESETS: ColorPreset[] = [
  { id: 'midnight_ember',  name: 'Midnight Ember',  tagline: 'Dark & fiery',     accentColor: '#FF6B35', darkBg: '#0a0a0a', lightBg: '#ffffff', colorScheme: 'dark' },
  { id: 'arctic_pulse',    name: 'Arctic Pulse',    tagline: 'Ice cold neon',    accentColor: '#00D4FF', darkBg: '#050d1a', lightBg: '#f0f8ff', colorScheme: 'dark' },
  { id: 'crimson_dark',    name: 'Crimson Dark',    tagline: 'Bold & dangerous', accentColor: '#e11d48', darkBg: '#0c0007', lightBg: '#fff0f3', colorScheme: 'dark' },
  { id: 'forest_night',    name: 'Forest Night',    tagline: 'Organic & alive',  accentColor: '#22c55e', darkBg: '#061410', lightBg: '#f0faf4', colorScheme: 'dark' },
  { id: 'violet_storm',    name: 'Violet Storm',    tagline: 'Mystical depth',   accentColor: '#8b5cf6', darkBg: '#0d0a1a', lightBg: '#f5f0ff', colorScheme: 'dark' },
  { id: 'solar_flare',     name: 'Solar Flare',     tagline: 'Warm & radiant',   accentColor: '#f59e0b', darkBg: '#100800', lightBg: '#fffbf0', colorScheme: 'dark' },
  { id: 'rose_quartz',     name: 'Rose Quartz',     tagline: 'Soft & elegant',   accentColor: '#ec4899', darkBg: '#1a0912', lightBg: '#fef0f7', colorScheme: 'light' },
  { id: 'ocean_mist',      name: 'Ocean Mist',      tagline: 'Clean & open',     accentColor: '#3b82f6', darkBg: '#060d1a', lightBg: '#f0f5ff', colorScheme: 'light' },
  { id: 'obsidian_gold',   name: 'Obsidian Gold',   tagline: 'Luxury & power',   accentColor: '#d97706', darkBg: '#0a0800', lightBg: '#fdfbf0', colorScheme: 'dark' },
  { id: 'cyber_lime',      name: 'Cyber Lime',      tagline: 'Hacker vibes',     accentColor: '#84cc16', darkBg: '#030a00', lightBg: '#f7ffe8', colorScheme: 'dark' },
  { id: 'pearl_minimal',   name: 'Pearl Minimal',   tagline: 'Pure simplicity',  accentColor: '#64748b', darkBg: '#0f0f0f', lightBg: '#fafafa', colorScheme: 'light' },
  { id: 'coral_sunset',    name: 'Coral Sunset',    tagline: 'Warm & inviting',  accentColor: '#f97316', darkBg: '#0f0500', lightBg: '#fff7f0', colorScheme: 'dark' },
];

// ── Block thumbnails (SVG) ───────────────────────────────────────────────
function BlockThumbnail({ blockId, accent }: { blockId: string; accent: string }) {
  const a = accent;
  const dim = 'rgba(255,255,255,0.07)';
  const text = 'rgba(255,255,255,0.25)';
  const textBright = 'rgba(255,255,255,0.5)';

  const thumbnails: Record<string, React.ReactNode> = {
    header: (
      <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="40" fill="#111"/>
        <circle cx="16" cy="20" r="7" fill={a} opacity="0.9"/>
        <rect x="30" y="17" width="18" height="3" rx="1.5" fill={text}/>
        <rect x="52" y="17" width="14" height="3" rx="1.5" fill={text}/>
        <rect x="70" y="17" width="16" height="3" rx="1.5" fill={text}/>
        <rect x="93" y="14" width="20" height="12" rx="5" fill={a} opacity="0.8"/>
      </svg>
    ),
    hero: (
      <svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="70" fill="#0a0a0a"/>
        {[0,1,2,3,4,5].map(i => <line key={i} x1={i*24} y1="0" x2={i*24} y2="70" stroke={dim} strokeWidth="0.5"/>)}
        {[0,1,2,3].map(i => <line key={i} x1="0" y1={i*23} x2="120" y2={i*23} stroke={dim} strokeWidth="0.5"/>)}
        <ellipse cx="60" cy="0" rx="50" ry="30" fill={a} opacity="0.08"/>
        <rect x="25" y="12" width="70" height="8" rx="2" fill={textBright}/>
        <rect x="35" y="24" width="50" height="5" rx="1.5" fill={text}/>
        <rect x="40" y="32" width="40" height="5" rx="1.5" fill={text}/>
        <rect x="38" y="44" width="20" height="12" rx="5" fill={a}/>
        <rect x="62" y="44" width="20" height="12" rx="5" fill="none" stroke={a} strokeWidth="1"/>
      </svg>
    ),
    about: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        <rect x="8" y="8" width="50" height="44" rx="4" fill={dim}/>
        <rect x="66" y="12" width="46" height="6" rx="2" fill={textBright}/>
        <rect x="66" y="22" width="40" height="3" rx="1.5" fill={text}/>
        <rect x="66" y="28" width="44" height="3" rx="1.5" fill={text}/>
        <rect x="66" y="34" width="36" height="3" rx="1.5" fill={text}/>
        <rect x="66" y="44" width="22" height="8" rx="4" fill={a} opacity="0.8"/>
      </svg>
    ),
    services: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x={8+i*38} y="16" width="32" height="36" rx="4" fill={dim}/>
            <rect x={14+i*38} y="22" width="12" height="12" rx="3" fill={a} opacity="0.6"/>
            <rect x={14+i*38} y="38" width="20" height="3" rx="1.5" fill={textBright}/>
            <rect x={14+i*38} y="44" width="16" height="2" rx="1" fill={text}/>
          </g>
        ))}
      </svg>
    ),
    features: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        <rect x="30" y="6" width="60" height="5" rx="2" fill={textBright}/>
        <rect x="38" y="14" width="44" height="3" rx="1.5" fill={text}/>
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x={8+i*38} y="24" width="32" height="28" rx="4" fill={dim}/>
            <circle cx={24+i*38} cy="33" r="5" fill={a} opacity="0.5"/>
            <rect x={14+i*38} y="42" width="20" height="3" rx="1.5" fill={textBright}/>
            <rect x={14+i*38} y="47" width="14" height="2" rx="1" fill={text}/>
          </g>
        ))}
      </svg>
    ),
    portfolio: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        <rect x="8" y="8" width="50" height="32" rx="4" fill={dim}/>
        <rect x="8" y="8" width="50" height="32" rx="4" fill={a} opacity="0.05"/>
        <circle cx="20" cy="20" r="5" fill={a} opacity="0.5"/>
        <rect x="62" y="8" width="50" height="14" rx="4" fill={dim}/>
        <rect x="62" y="26" width="50" height="14" rx="4" fill={dim}/>
        <rect x="62" y="44" width="22" height="8" rx="4" fill={a} opacity="0.6"/>
      </svg>
    ),
    stats: (
      <svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="50" fill="#0a0a0a"/>
        {[0,1,2,3].map(i => (
          <g key={i}>
            <rect x={8+i*28} y="10" width="22" height="30" rx="3" fill={dim}/>
            <rect x={13+i*28} y="16" width="12" height="8" rx="1" fill={a} opacity="0.7"/>
            <rect x={13+i*28} y="28" width="12" height="3" rx="1" fill={textBright}/>
            <rect x={13+i*28} y="33" width="8" height="2" rx="1" fill={text}/>
          </g>
        ))}
      </svg>
    ),
    testimonials: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        {[0,1].map(i => (
          <g key={i}>
            <rect x={6+i*59} y="8" width="52" height="44" rx="6" fill={dim}/>
            <text x={14+i*59} y="22" fill={a} fontSize="12" opacity="0.8">&quot;</text>
            <rect x={14+i*59} y="24" width="36" height="2" rx="1" fill={text}/>
            <rect x={14+i*59} y="29" width="30" height="2" rx="1" fill={text}/>
            <rect x={14+i*59} y="34" width="33" height="2" rx="1" fill={text}/>
            <circle cx={18+i*59} cy="43" r="5" fill={a} opacity="0.4"/>
            <rect x={26+i*59} y="40" width="18" height="2.5" rx="1" fill={textBright}/>
            <rect x={26+i*59} y="45" width="14" height="2" rx="1" fill={text}/>
          </g>
        ))}
      </svg>
    ),
    pricing: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        <rect x="8" y="8" width="32" height="44" rx="4" fill={dim}/>
        <rect x="44" y="4" width="32" height="52" rx="4" fill={a} opacity="0.1"/>
        <rect x="44" y="4" width="32" height="52" rx="4" stroke={a} strokeWidth="1" fill="none"/>
        <rect x="80" y="8" width="32" height="44" rx="4" fill={dim}/>
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x={13} y={20+i*8} width="22" height="2.5" rx="1" fill={text}/>
            <rect x={49} y={16+i*8} width="22" height="2.5" rx="1" fill={textBright}/>
            <rect x={85} y={20+i*8} width="22" height="2.5" rx="1" fill={text}/>
          </g>
        ))}
        <rect x={49} y={45} width="22" height="8" rx="3" fill={a}/>
      </svg>
    ),
    faq: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        {[0,1,2,3].map(i => (
          <g key={i}>
            <rect x="8" y={6+i*14} width="104" height="10" rx="3" fill={dim}/>
            <rect x="14" y={9+i*14} width="60" height="3" rx="1.5" fill={i===1 ? textBright : text}/>
            <text x="102" y={13+i*14} fill={i===1 ? a : text} fontSize="8">
              {i===1 ? '−' : '+'}
            </text>
          </g>
        ))}
      </svg>
    ),
    contact: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        <rect x="8" y="8" width="48" height="44" rx="4" fill="none"/>
        <rect x="8" y="12" width="48" height="8" rx="2" fill={dim}/>
        <rect x="8" y="24" width="48" height="8" rx="2" fill={dim}/>
        <rect x="8" y="36" width="48" height="12" rx="2" fill={dim}/>
        <rect x="62" y="10" width="50" height="40" rx="4" fill={dim}/>
        <circle cx="77" cy="22" r="4" fill={a} opacity="0.6"/>
        <rect x="85" y="20" width="20" height="3" rx="1.5" fill={textBright}/>
        <rect x="85" y="26" width="16" height="2" rx="1" fill={text}/>
        <rect x="62" y="42" width="50" height="1" fill="none" stroke={a} strokeWidth="0.5" opacity="0.3"/>
        <rect x="8" y="52" width="20" height="6" rx="3" fill={a} opacity="0.8"/>
      </svg>
    ),
    team: (
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="60" fill="#0a0a0a"/>
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x={8+i*38} y="8" width="32" height="44" rx="6" fill={dim}/>
            <circle cx={24+i*38} cy="24" r="10" fill={a} opacity="0.25"/>
            <rect x={14+i*38} y="38" width="20" height="3" rx="1.5" fill={textBright}/>
            <rect x={16+i*38} y="43" width="16" height="2" rx="1" fill={a} opacity="0.6"/>
          </g>
        ))}
      </svg>
    ),
    footer: (
      <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="40" fill="#080808"/>
        <rect x="0" y="0" width="120" height="1" fill={a} opacity="0.2"/>
        <circle cx="16" cy="15" r="5" fill={a} opacity="0.7"/>
        <rect x="26" y="12" width="20" height="3" rx="1.5" fill={textBright}/>
        <rect x="26" y="18" width="14" height="2" rx="1" fill={text}/>
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x={64+i*20} y="10" width="14" height="2" rx="1" fill={textBright}/>
            <rect x={64+i*20} y="15" width="12" height="2" rx="1" fill={text}/>
            <rect x={64+i*20} y="20" width="10" height="2" rx="1" fill={text}/>
          </g>
        ))}
        <rect x="8" y="32" width="104" height="0.5" fill={text}/>
      </svg>
    ),
  };

  return (
    <div style={{ width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      {thumbnails[blockId] ?? (
        <svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="50" fill="#111"/>
          <rect x="20" y="10" width="80" height="30" rx="4" fill="rgba(255,255,255,0.05)"/>
        </svg>
      )}
    </div>
  );
}

// ── Business type SVG thumbnails ─────────────────────────────────────────
function BusinessTypeThumbnail({ id }: { id: string }) {
  const bg = '#111';
  const dim = 'rgba(255,255,255,0.06)';
  const mid = 'rgba(255,255,255,0.15)';
  const brt = 'rgba(255,255,255,0.55)';

  const svgs: Record<string, React.ReactNode> = {
    food: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Table */}
        <rect x="20" y="44" width="80" height="4" rx="2" fill={mid}/>
        <rect x="30" y="48" width="4" height="14" rx="2" fill={dim}/>
        <rect x="86" y="48" width="4" height="14" rx="2" fill={dim}/>
        {/* Plate */}
        <ellipse cx="60" cy="42" rx="22" ry="6" fill={dim}/>
        <ellipse cx="60" cy="40" rx="18" ry="5" fill="rgba(255,255,255,0.04)"/>
        {/* Food items */}
        <ellipse cx="53" cy="37" rx="7" ry="5" fill="#c2410c" opacity="0.8"/>
        <ellipse cx="67" cy="37" rx="6" ry="4" fill="#16a34a" opacity="0.7"/>
        <ellipse cx="60" cy="35" rx="5" ry="3" fill="#d97706" opacity="0.9"/>
        {/* Steam */}
        <path d="M52 28 Q54 24 52 20" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M60 26 Q62 22 60 18" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M68 28 Q70 24 68 20" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Wine glass */}
        <path d="M95 50 L92 38 L98 38 Z" fill={dim}/>
        <rect x="94" y="50" width="2" height="6" rx="1" fill={dim}/>
        <rect x="91" y="56" width="8" height="2" rx="1" fill={dim}/>
        {/* Fork */}
        <rect x="25" y="30" width="1.5" height="20" rx="0.75" fill={mid}/>
        <rect x="23" y="30" width="1.5" height="8" rx="0.75" fill={mid}/>
        <rect x="27" y="30" width="1.5" height="8" rx="0.75" fill={mid}/>
      </svg>
    ),
    shop: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Storefront */}
        <rect x="15" y="28" width="90" height="38" rx="3" fill={dim}/>
        <rect x="15" y="20" width="90" height="12" rx="3" fill="rgba(255,255,255,0.1)"/>
        {/* Awning stripes */}
        {[0,1,2,3,4].map(i => (
          <rect key={i} x={15+i*18} y="20" width="9" height="12" fill="#e11d48" opacity={0.4-i*0.05}/>
        ))}
        {/* Door */}
        <rect x="50" y="44" width="20" height="22" rx="2" fill="rgba(255,255,255,0.08)"/>
        <circle cx="67" cy="55" r="1.5" fill={mid}/>
        {/* Windows */}
        <rect x="22" y="34" width="20" height="14" rx="2" fill="rgba(255,255,255,0.08)"/>
        <rect x="78" y="34" width="20" height="14" rx="2" fill="rgba(255,255,255,0.08)"/>
        {/* Products in window */}
        <rect x="26" y="37" width="6" height="8" rx="1" fill="#d97706" opacity="0.6"/>
        <rect x="34" y="39" width="5" height="6" rx="1" fill="#7c3aed" opacity="0.6"/>
        <rect x="82" y="36" width="5" height="9" rx="1" fill="#059669" opacity="0.6"/>
        <rect x="89" y="38" width="6" height="7" rx="1" fill="#db2777" opacity="0.6"/>
        {/* Sign */}
        <rect x="35" y="13" width="50" height="8" rx="2" fill="rgba(255,255,255,0.15)"/>
        <rect x="42" y="16" width="36" height="2" rx="1" fill={brt}/>
      </svg>
    ),
    ecommerce: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Screen */}
        <rect x="12" y="10" width="96" height="56" rx="4" fill={dim}/>
        <rect x="16" y="14" width="88" height="48" rx="2" fill="rgba(255,255,255,0.03)"/>
        {/* Product grid */}
        {[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]].map(([col, row], i) => (
          <g key={i}>
            <rect x={20+col*30} y={18+row*24} width="24" height="18" rx="2" fill="rgba(255,255,255,0.07)"/>
            <rect x={23+col*30} y={21+row*24} width="18" height="10" rx="1" fill={['#e11d48','#3b82f6','#16a34a','#d97706','#8b5cf6','#f97316'][i]} opacity="0.5"/>
            <rect x={23+col*30} y={33+row*24} width="10" height="1.5" rx="0.75" fill={mid}/>
          </g>
        ))}
        {/* Cart icon */}
        <circle cx="100" cy="18" r="7" fill="#FF6B35" opacity="0.9"/>
        <path d="M96 16 L97 14 L104 14 L102 19 L98 19 Z" fill="white" opacity="0.9"/>
        <circle cx="99" cy="21" r="1" fill="white" opacity="0.9"/>
        <circle cx="102" cy="21" r="1" fill="white" opacity="0.9"/>
      </svg>
    ),
    startup: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Rocket */}
        <path d="M60 8 L68 30 L60 26 L52 30 Z" fill="#8b5cf6" opacity="0.9"/>
        <rect x="55" y="26" width="10" height="18" rx="2" fill="#7c3aed" opacity="0.8"/>
        <path d="M55 38 L50 46 L55 44 Z" fill="#c4b5fd" opacity="0.6"/>
        <path d="M65 38 L70 46 L65 44 Z" fill="#c4b5fd" opacity="0.6"/>
        {/* Flame */}
        <ellipse cx="60" cy="46" rx="5" ry="8" fill="#f59e0b" opacity="0.7"/>
        <ellipse cx="60" cy="46" rx="3" ry="5" fill="#fbbf24" opacity="0.9"/>
        {/* Stars */}
        {[[20,15],[30,25],[90,12],[95,28],[15,40],[100,45]].map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(255,255,255,0.5)"/>
        ))}
        {/* Graph line */}
        <polyline points="10,62 30,55 50,50 70,42 90,35 110,25" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
        <circle cx="110" cy="25" r="3" fill="#22c55e" opacity="0.9"/>
      </svg>
    ),
    portfolio: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Large artwork frame */}
        <rect x="12" y="10" width="55" height="40" rx="3" fill={dim}/>
        <rect x="15" y="13" width="49" height="34" rx="2" fill="rgba(255,255,255,0.04)"/>
        {/* Abstract art */}
        <circle cx="30" cy="28" r="10" fill="#8b5cf6" opacity="0.4"/>
        <circle cx="45" cy="35" r="8" fill="#3b82f6" opacity="0.4"/>
        <rect x="18" y="20" width="15" height="20" rx="2" fill="#e11d48" opacity="0.25"/>
        {/* Small frames */}
        <rect x="72" y="10" width="18" height="16" rx="2" fill={dim}/>
        <rect x="93" y="10" width="18" height="16" rx="2" fill={dim}/>
        <rect x="72" y="30" width="18" height="20" rx="2" fill={dim}/>
        <rect x="93" y="30" width="18" height="20" rx="2" fill={dim}/>
        {/* Frame highlights */}
        <rect x="75" y="13" width="12" height="10" rx="1" fill="#d97706" opacity="0.4"/>
        <rect x="96" y="13" width="12" height="10" rx="1" fill="#16a34a" opacity="0.4"/>
        <rect x="75" y="33" width="12" height="14" rx="1" fill="#db2777" opacity="0.4"/>
        <rect x="96" y="33" width="12" height="14" rx="1" fill="#0ea5e9" opacity="0.4"/>
        {/* Name */}
        <rect x="12" y="54" width="30" height="4" rx="2" fill={brt}/>
        <rect x="12" y="61" width="22" height="3" rx="1.5" fill={mid}/>
      </svg>
    ),
    beauty: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Mirror */}
        <ellipse cx="60" cy="32" rx="28" ry="28" fill={dim}/>
        <ellipse cx="60" cy="32" rx="22" ry="22" fill="rgba(255,255,255,0.04)"/>
        <rect x="57" y="58" width="6" height="10" rx="2" fill={dim}/>
        <rect x="50" y="66" width="20" height="3" rx="1.5" fill={dim}/>
        {/* Reflection sparkle */}
        {[[48,22],[72,18],[66,38],[52,40]].map(([x,y], i) => (
          <g key={i}>
            <line x1={x} y1={y-4} x2={x} y2={y+4} stroke="#f9a8d4" strokeWidth="1.5" opacity="0.7"/>
            <line x1={x-4} y1={y} x2={x+4} y2={y} stroke="#f9a8d4" strokeWidth="1.5" opacity="0.7"/>
          </g>
        ))}
        {/* Products */}
        <rect x="12" y="52" width="14" height="14" rx="3" fill="#db2777" opacity="0.7"/>
        <rect x="30" y="56" width="10" height="10" rx="2" fill="#f472b6" opacity="0.6"/>
        <rect x="80" y="54" width="12" height="12" rx="2" fill="#9333ea" opacity="0.6"/>
        <rect x="96" y="50" width="12" height="16" rx="3" fill="#c026d3" opacity="0.5"/>
        {/* Flower */}
        {[0,60,120,180,240,300].map((deg, i) => (
          <ellipse key={i} cx={60+8*Math.cos(deg*Math.PI/180)} cy={32+8*Math.sin(deg*Math.PI/180)} rx="5" ry="3" fill="#fda4af" opacity="0.5" transform={`rotate(${deg},${60+8*Math.cos(deg*Math.PI/180)},${32+8*Math.sin(deg*Math.PI/180)})`}/>
        ))}
        <circle cx="60" cy="32" r="4" fill="#fbbf24" opacity="0.8"/>
      </svg>
    ),
    health: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Heart */}
        <path d="M60 54 C60 54 28 38 28 22 C28 14 35 8 44 12 C50 14 54 18 60 24 C66 18 70 14 76 12 C85 8 92 14 92 22 C92 38 60 54 60 54 Z" fill="#e11d48" opacity="0.7"/>
        {/* Pulse line */}
        <polyline points="15,36 30,36 36,24 42,46 48,30 54,38 60,38 66,38 72,20 78,42 84,36 105,36" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        {/* Stats */}
        <rect x="12" y="56" width="28" height="12" rx="3" fill={dim}/>
        <rect x="46" y="56" width="28" height="12" rx="3" fill={dim}/>
        <rect x="80" y="56" width="28" height="12" rx="3" fill={dim}/>
        <rect x="15" y="60" width="8" height="2" rx="1" fill="#22c55e" opacity="0.8"/>
        <rect x="49" y="60" width="8" height="2" rx="1" fill="#3b82f6" opacity="0.8"/>
        <rect x="83" y="60" width="8" height="2" rx="1" fill="#f59e0b" opacity="0.8"/>
        <rect x="15" y="63" width="18" height="2" rx="1" fill={mid}/>
        <rect x="49" y="63" width="18" height="2" rx="1" fill={mid}/>
        <rect x="83" y="63" width="18" height="2" rx="1" fill={mid}/>
      </svg>
    ),
    education: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Graduation cap */}
        <rect x="42" y="30" width="36" height="6" rx="1" fill={brt}/>
        <path d="M60 36 L78 30 L60 24 L42 30 Z" fill="rgba(255,255,255,0.7)"/>
        <rect x="74" y="30" width="2" height="12" rx="1" fill={mid}/>
        <path d="M50 40 L60 44 L70 40 L70 50 C70 54 65 58 60 58 C55 58 50 54 50 50 Z" fill="rgba(255,255,255,0.2)"/>
        {/* Books */}
        <rect x="12" y="42" width="12" height="20" rx="2" fill="#3b82f6" opacity="0.7"/>
        <rect x="14" y="42" width="2" height="20" fill="#1d4ed8" opacity="0.5"/>
        <rect x="26" y="44" width="12" height="18" rx="2" fill="#e11d48" opacity="0.7"/>
        <rect x="28" y="44" width="2" height="18" fill="#9f1239" opacity="0.5"/>
        <rect x="40" y="46" width="10" height="16" rx="2" fill="#16a34a" opacity="0.7"/>
        {/* Stars */}
        <rect x="86" y="46" width="22" height="16" rx="3" fill={dim}/>
        {[0,1,2].map(i => <circle key={i} cx={90+i*7} cy="54" r="3" fill="#fbbf24" opacity="0.8"/>)}
        {/* Pencil */}
        <rect x="94" y="10" width="4" height="22" rx="1" fill="#fbbf24" opacity="0.8"/>
        <path d="M94 32 L98 32 L96 38 Z" fill="#e11d48" opacity="0.7"/>
      </svg>
    ),
    agency: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Building */}
        <rect x="30" y="20" width="60" height="50" rx="2" fill={dim}/>
        <rect x="30" y="14" width="60" height="10" rx="2" fill="rgba(255,255,255,0.1)"/>
        {/* Windows grid */}
        {[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]].map(([col,row], i) => (
          <rect key={i} x={36+col*18} y={28+row*12} width="12" height="8" rx="1"
            fill={i%3===0 ? '#3b82f6' : i%3===1 ? '#f59e0b' : dim} opacity={i%3===0 ? 0.5 : i%3===1 ? 0.4 : 0.6}/>
        ))}
        {/* Door */}
        <rect x="51" y="56" width="18" height="14" rx="1" fill="rgba(255,255,255,0.1)"/>
        {/* Logo on building */}
        <rect x="38" y="17" width="44" height="4" rx="1" fill={brt}/>
        {/* Small buildings bg */}
        <rect x="8" y="38" width="20" height="32" rx="1" fill="rgba(255,255,255,0.04)"/>
        <rect x="92" y="44" width="20" height="26" rx="1" fill="rgba(255,255,255,0.04)"/>
      </svg>
    ),
    consulting: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Chart */}
        <rect x="14" y="12" width="92" height="50" rx="4" fill={dim}/>
        {/* Bar chart */}
        <rect x="24" y="46" width="12" height="12" rx="1" fill="#3b82f6" opacity="0.7"/>
        <rect x="40" y="36" width="12" height="22" rx="1" fill="#3b82f6" opacity="0.7"/>
        <rect x="56" y="28" width="12" height="30" rx="1" fill="#22c55e" opacity="0.8"/>
        <rect x="72" y="22" width="12" height="36" rx="1" fill="#22c55e" opacity="0.8"/>
        <rect x="88" y="18" width="12" height="40" rx="1" fill="#f59e0b" opacity="0.8"/>
        {/* Trend line */}
        <polyline points="30,46 46,36 62,28 78,22 94,16" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2" opacity="0.8"/>
        {/* Axis */}
        <line x1="20" y1="58" x2="104" y2="58" stroke={mid} strokeWidth="1"/>
        <line x1="20" y1="14" x2="20" y2="58" stroke={mid} strokeWidth="1"/>
        {/* Legend */}
        <rect x="24" y="64" width="6" height="4" rx="1" fill="#3b82f6" opacity="0.7"/>
        <rect x="32" y="65" width="14" height="2" rx="1" fill={mid}/>
        <rect x="52" y="64" width="6" height="4" rx="1" fill="#22c55e" opacity="0.8"/>
        <rect x="60" y="65" width="14" height="2" rx="1" fill={mid}/>
      </svg>
    ),
    blog: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Article card */}
        <rect x="12" y="10" width="96" height="52" rx="4" fill={dim}/>
        {/* Hero image area */}
        <rect x="16" y="14" width="88" height="22" rx="2" fill="rgba(255,255,255,0.06)"/>
        <rect x="16" y="14" width="88" height="22" rx="2" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
        {/* Image scenery */}
        <rect x="16" y="24" width="88" height="12" rx="0" fill="#1d4ed8" opacity="0.2"/>
        <ellipse cx="80" cy="26" rx="20" ry="12" fill="#f59e0b" opacity="0.2"/>
        <path d="M16 30 Q30 22 45 28 Q60 34 75 26 Q90 18 104 24 L104 36 L16 36 Z" fill="#16a34a" opacity="0.3"/>
        {/* Title */}
        <rect x="20" y="40" width="60" height="5" rx="2" fill={brt}/>
        {/* Body text lines */}
        <rect x="20" y="48" width="76" height="2.5" rx="1" fill={mid}/>
        <rect x="20" y="53" width="68" height="2.5" rx="1" fill={mid}/>
        {/* Category tag */}
        <rect x="76" y="39" width="26" height="8" rx="4" fill="#8b5cf6" opacity="0.6"/>
        <rect x="82" y="42" width="14" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
        {/* Read more */}
        <rect x="20" y="64" width="28" height="6" rx="3" fill={dim}/>
        <rect x="22" y="66" width="20" height="2" rx="1" fill={mid}/>
        {/* Avatar */}
        <circle cx="96" cy="67" r="5" fill="#e11d48" opacity="0.6"/>
      </svg>
    ),
    event: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Stage / spotlight */}
        <path d="M20 72 L40 35 L80 35 L100 72 Z" fill="rgba(255,200,50,0.06)"/>
        <path d="M35 72 L48 35 L72 35 L85 72 Z" fill="rgba(255,200,50,0.08)"/>
        {/* Stage */}
        <rect x="20" y="54" width="80" height="6" rx="2" fill="rgba(255,255,255,0.1)"/>
        {/* Spotlights */}
        <circle cx="30" cy="16" r="5" fill="#fbbf24" opacity="0.8"/>
        <circle cx="60" cy="12" r="5" fill="#fbbf24" opacity="0.8"/>
        <circle cx="90" cy="16" r="5" fill="#fbbf24" opacity="0.8"/>
        {/* People silhouettes */}
        {[20,34,48,62,76,90,100].map((x,i) => (
          <g key={i}>
            <circle cx={x} cy="63" r="4" fill="rgba(255,255,255,0.15)"/>
            <rect x={x-3} y="67" width="6" height="5" rx="1" fill="rgba(255,255,255,0.1)"/>
          </g>
        ))}
        {/* Confetti */}
        {[[25,22,'#e11d48'],[45,18,'#3b82f6'],[75,20,'#22c55e'],[95,25,'#f59e0b'],[55,30,'#8b5cf6']].map(([x,y,c], i) => (
          <rect key={i} x={Number(x)} y={Number(y)} width="4" height="4" rx="1" fill={String(c)} opacity="0.7" transform={`rotate(${i*35},${x},${y})`}/>
        ))}
        {/* Date card */}
        <rect x="46" y="36" width="28" height="16" rx="2" fill="rgba(255,255,255,0.12)"/>
        <rect x="48" y="38" width="24" height="4" rx="1" fill="#e11d48" opacity="0.8"/>
        <rect x="51" y="44" width="18" height="3" rx="1" fill={brt}/>
        <rect x="53" y="48" width="14" height="2" rx="1" fill={mid}/>
      </svg>
    ),
    real_estate: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* House */}
        <path d="M60 12 L88 34 L76 34 L76 62 L44 62 L44 34 L32 34 Z" fill={dim}/>
        <path d="M60 14 L86 34 L34 34 Z" fill="rgba(255,255,255,0.12)"/>
        {/* Door */}
        <rect x="53" y="48" width="14" height="14" rx="1" fill="rgba(255,255,255,0.08)"/>
        <circle cx="64" cy="55" r="1.5" fill={mid}/>
        {/* Windows */}
        <rect x="47" y="38" width="10" height="8" rx="1" fill="#3b82f6" opacity="0.4"/>
        <rect x="63" y="38" width="10" height="8" rx="1" fill="#3b82f6" opacity="0.4"/>
        {/* Window cross */}
        <line x1="52" y1="38" x2="52" y2="46" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
        <line x1="47" y1="42" x2="57" y2="42" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
        {/* Ground */}
        <rect x="12" y="62" width="96" height="4" rx="2" fill="rgba(255,255,255,0.05)"/>
        {/* Trees */}
        <circle cx="18" cy="56" r="8" fill="#16a34a" opacity="0.5"/>
        <rect x="17" y="60" width="2" height="8" rx="1" fill="#854d0e" opacity="0.5"/>
        <circle cx="102" cy="58" r="6" fill="#16a34a" opacity="0.5"/>
        <rect x="101" y="61" width="2" height="6" rx="1" fill="#854d0e" opacity="0.5"/>
        {/* Price tag */}
        <rect x="78" y="16" width="30" height="14" rx="3" fill="#22c55e" opacity="0.8"/>
        <rect x="82" y="20" width="22" height="3" rx="1" fill="rgba(255,255,255,0.9)"/>
        <rect x="84" y="25" width="18" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
      </svg>
    ),
    travel: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Sky */}
        <rect x="0" y="0" width="120" height="45" fill="#0c4a6e" opacity="0.4"/>
        {/* Sun */}
        <circle cx="90" cy="20" r="10" fill="#fbbf24" opacity="0.8"/>
        {/* Clouds */}
        <ellipse cx="25" cy="18" rx="12" ry="5" fill="rgba(255,255,255,0.15)"/>
        <ellipse cx="35" cy="16" rx="8" ry="4" fill="rgba(255,255,255,0.1)"/>
        {/* Mountains */}
        <path d="M0 45 L20 20 L40 45 Z" fill="#374151" opacity="0.6"/>
        <path d="M25 45 L50 15 L75 45 Z" fill="#1f2937" opacity="0.7"/>
        <path d="M60 45 L85 22 L110 45 Z" fill="#374151" opacity="0.5"/>
        {/* Snow caps */}
        <path d="M50 15 L44 28 L56 28 Z" fill="rgba(255,255,255,0.5)"/>
        <path d="M85 22 L80 32 L90 32 Z" fill="rgba(255,255,255,0.4)"/>
        {/* Water */}
        <rect x="0" y="45" width="120" height="27" fill="#0369a1" opacity="0.3"/>
        <path d="M0 50 Q15 46 30 50 Q45 54 60 50 Q75 46 90 50 Q105 54 120 50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        {/* Plane */}
        <path d="M56 32 L64 28 L66 30 L60 34 Z" fill="rgba(255,255,255,0.7)"/>
        <path d="M58 31 L62 25 L64 26 L61 32 Z" fill="rgba(255,255,255,0.5)"/>
        <path d="M60 33 L62 38 L63 37 L62 33 Z" fill="rgba(255,255,255,0.5)"/>
      </svg>
    ),
    craft: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Canvas */}
        <rect x="28" y="8" width="64" height="50" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
        {/* Abstract painting */}
        <circle cx="50" cy="30" r="14" fill="#8b5cf6" opacity="0.4"/>
        <circle cx="70" cy="35" r="12" fill="#3b82f6" opacity="0.4"/>
        <circle cx="60" cy="22" r="10" fill="#e11d48" opacity="0.35"/>
        <path d="M35 42 Q48 30 60 40 Q72 50 85 38" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
        {/* Easel legs */}
        <line x1="28" y1="58" x2="20" y2="72" stroke={mid} strokeWidth="2" strokeLinecap="round"/>
        <line x1="92" y1="58" x2="100" y2="72" stroke={mid} strokeWidth="2" strokeLinecap="round"/>
        <line x1="60" y1="58" x2="60" y2="72" stroke={mid} strokeWidth="2" strokeLinecap="round"/>
        {/* Palette */}
        <ellipse cx="15" cy="36" rx="8" ry="10" fill={dim}/>
        {[['#e11d48',11,30],['#3b82f6',18,28],['#22c55e',11,40],['#fbbf24',18,42]].map(([c,x,y],i) => (
          <circle key={i} cx={Number(x)} cy={Number(y)} r="2.5" fill={String(c)} opacity="0.8"/>
        ))}
        {/* Brushes */}
        <rect x="104" y="18" width="3" height="20" rx="1" fill="#854d0e" opacity="0.7"/>
        <path d="M104 18 L107 18 L106 12 Z" fill="#e11d48" opacity="0.8"/>
        <rect x="110" y="22" width="3" height="16" rx="1" fill="#854d0e" opacity="0.7"/>
        <path d="M110 22 L113 22 L112 16 Z" fill="#8b5cf6" opacity="0.8"/>
      </svg>
    ),
    business_card: (
      <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="72" fill={bg}/>
        {/* Back card */}
        <rect x="22" y="20" width="80" height="46" rx="4" fill="rgba(255,255,255,0.04)" transform="rotate(-3 62 43)"/>
        {/* Front card */}
        <rect x="18" y="16" width="84" height="46" rx="4" fill={dim}/>
        {/* Card content */}
        <rect x="28" y="24" width="30" height="30" rx="3" fill="rgba(255,255,255,0.06)"/>
        {/* Avatar placeholder */}
        <circle cx="43" cy="34" r="8" fill="#8b5cf6" opacity="0.5"/>
        <rect x="35" y="44" width="16" height="2" rx="1" fill={mid}/>
        {/* Info lines */}
        <rect x="65" y="24" width="28" height="5" rx="2" fill={brt}/>
        <rect x="65" y="32" width="20" height="3" rx="1.5" fill="#FF6B35" opacity="0.8"/>
        <rect x="65" y="38" width="24" height="2.5" rx="1" fill={mid}/>
        <rect x="65" y="43" width="22" height="2.5" rx="1" fill={mid}/>
        <rect x="65" y="48" width="18" height="2.5" rx="1" fill={mid}/>
        {/* Social icons row */}
        {[0,1,2].map(i => <circle key={i} cx={65+i*10} cy="57" r="4" fill={dim}/>)}
        {/* QR code hint */}
        <rect x="90" y="52" width="10" height="10" rx="1" fill="rgba(255,255,255,0.08)"/>
        {[[0,0],[1,0],[0,1]].map(([c,r],i) => <rect key={i} x={91+c*4} y={53+r*4} width="3" height="3" rx="0.5" fill={mid}/>)}
      </svg>
    ),
  };

  return (
    <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      {svgs[id] ?? (
        <svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="72" fill="#111"/>
        </svg>
      )}
    </div>
  );
}
function AssemblerInner({ contract, onAssembled }: { contract: InteractiveContract; onAssembled: (json: string) => void }) {
  const { query, actions } = useEditor();
  const assembled = useRef(false);

  useEffect(() => {
    if (assembled.current) return;
    assembled.current = true;
    setTimeout(() => {
      try {
        const elements = buildElementsFromContract(contract);
        const ROOT_ID = 'ROOT';
        const state = query.getState();
        const rootNode = state?.nodes?.[ROOT_ID];
        const childIds = (rootNode?.data?.nodes ?? []) as string[];
        [...childIds].reverse().forEach((id) => actions.delete(id));
        elements.forEach((element, index) => {
          const tree = query.parseReactElement(element).toNodeTree();
          actions.addNodeTree(tree, ROOT_ID, index);
        });
        requestAnimationFrame(() => {
          const json = query.serialize();
          onAssembled(json);
        });
      } catch (err) {
        console.error('Assembly failed:', err);
      }
    }, 200);
  }, [contract, query, actions, onAssembled]);

  return null;
}

// ── Preview frame ────────────────────────────────────────────────────────
function PreviewFrame({ craftJson, colorScheme }: { craftJson: string; colorScheme: 'dark' | 'light' }) {
  const siteContextValue = { navigateToPage: () => {}, toggleTheme: () => {}, colorScheme };
  return (
    <ThemeProvider initialAccent="#FF6B35" initialScheme={colorScheme}>
      <SiteContext.Provider value={siteContextValue}>
        <Editor resolver={resolver} enabled={false}>
          <Frame data={craftJson}><Element is={Container} canvas /></Frame>
        </Editor>
      </SiteContext.Provider>
    </ThemeProvider>
  );
}

// ── Blocks config ────────────────────────────────────────────────────────
const BLOCKS = [
  { id: 'header',       label: 'Header',       required: true },
  { id: 'hero',         label: 'Hero',         required: true },
  { id: 'about',        label: 'About',        required: false },
  { id: 'services',     label: 'Services',     required: false },
  { id: 'features',     label: 'Features',     required: false },
  { id: 'portfolio',    label: 'Portfolio',    required: false },
  { id: 'stats',        label: 'Stats',        required: false },
  { id: 'team',         label: 'Team',         required: false },
  { id: 'testimonials', label: 'Reviews',      required: false },
  { id: 'pricing',      label: 'Pricing',      required: false },
  { id: 'faq',          label: 'FAQ',          required: false },
  { id: 'contact',      label: 'Contact',      required: false },
  { id: 'footer',       label: 'Footer',       required: true },
];

// ── Main ─────────────────────────────────────────────────────────────────
export default function InteractivePage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissedRotate, setDismissedRotate] = useState(false);

  const [contract, setContract] = useState<ContractState>({
    businessType: null,
    presetId: null,
    blocks: ['header', 'hero', 'footer'],
    companyName: '',
    step: 1,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [craftJson, setCraftJson] = useState<string | null>(null);
  const [assembling, setAssembling] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMob = window.innerWidth < 768;
      setIsPortrait(isMob && window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectedPreset = COLOR_PRESETS.find(p => p.id === contract.presetId) ?? null;
  const accentColor = selectedPreset?.accentColor ?? '#FF6B35';

  const totalSteps = 4;
  const progress = (contract.step / totalSteps) * 100;

  const canProceed = () => {
    switch (contract.step) {
      case 1: return !!contract.businessType;
      case 2: return !!contract.presetId;
      case 3: return contract.blocks.length >= 3;
      case 4: return contract.companyName.trim().length >= 2;
      default: return false;
    }
  };

  const handleAssembled = useCallback((json: string) => {
    setCraftJson(json);
    setAssembling(false);
    setShowPreview(true);
  }, []);

  const handleNext = () => {
    if (contract.step < totalSteps) {
      setContract(prev => ({ ...prev, step: prev.step + 1 }));
    } else {
      setAssembling(true);
    }
  };

  const handleBack = () => {
    if (showPreview) { setShowPreview(false); setCraftJson(null); return; }
    if (contract.step > 1) {
      setContract(prev => ({ ...prev, step: prev.step - 1 }));
    } else {
      router.push(`/${locale}`);
    }
  };

  const handleSaveProject = async () => {
    if (!craftJson) return;
    setSaving(true);
    const preset = selectedPreset;
    const compressed = lz.compress(craftJson, { outputEncoding: 'Base64' });
    const projectData = {
      name: contract.companyName,
      description: `${contract.businessType} - ${preset?.name ?? 'custom'}`,
      source: 'interactive' as const,
      data: {
        craft: {
          schemaVersion: 2,
          pages: [{ id: 'page-1', name: 'Home', slug: 'home', data: null, desktopData: compressed, mobileData: null }],
          activePageId: 'page-1',
        },
      },
    };

    if (isAuthenticated && user) {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('projects').insert({ ...projectData, user_id: user.id }).select('id').single();
      if (error) { console.error('Failed to save:', error); alert('Failed to save project.'); setSaving(false); return; }
      router.push(`/${locale}/editor?id=${data.id}`);
    } else {
      localStorage.setItem('iam_interactive_contract', JSON.stringify({
        ...contract, craftJson: compressed, createdAt: new Date().toISOString(),
      }));
      router.push(`/${locale}/auth/signup?redirect=/${locale}/dashboard&from=interactive`);
    }
  };

  const toggleBlock = (id: string) => {
    const block = BLOCKS.find(b => b.id === id);
    if (block?.required) return;
    setContract(prev => ({
      ...prev,
      blocks: prev.blocks.includes(id)
        ? prev.blocks.filter(b => b !== id)
        : [...prev.blocks, id],
    }));
  };

  // Portrait overlay
  if (isPortrait && !dismissedRotate) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'linear-gradient(135deg, #FF4500, #FF6B35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>📱↻</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Rotate to Landscape</h2>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32, maxWidth: 300 }}>For the best experience, please rotate your device to landscape mode</p>
        <button onClick={() => setDismissedRotate(true)} style={{ padding: '12px 32px', borderRadius: 100, border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Continue anyway
        </button>
      </div>
    );
  }

  // Assembling
  if (assembling && !craftJson) {
    const preset = selectedPreset;
    const interactiveContract: InteractiveContract = {
      businessType: contract.businessType!,
      style: preset?.colorScheme === 'light' ? 'light' : 'dark',
      blocks: contract.blocks,
      companyName: contract.companyName,
      accentColor: preset?.accentColor,
      darkBg: preset?.darkBg,
      lightBg: preset?.lightBg,
    };
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24, animation: 'spin 2s linear infinite' }}>🚀</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Building your website...</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Assembling {contract.blocks.length} sections</p>
        <div style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          <ThemeProvider initialAccent={preset?.accentColor ?? '#FF6B35'} initialScheme={preset?.colorScheme ?? 'dark'}>
            <Editor resolver={resolver} enabled={true}>
              <AssemblerInner contract={interactiveContract} onAssembled={handleAssembled} />
              <Frame><Element is={Container} canvas /></Frame>
            </Editor>
          </ThemeProvider>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Preview
  if (showPreview && craftJson) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, background: '#111' }}>
          <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>← Back to edit</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: accentColor }}>{contract.companyName}</span>
          <button onClick={handleSaveProject} disabled={saving} style={{ padding: '8px 24px', borderRadius: 100, border: 'none', background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : isAuthenticated ? '💾 Save & Edit' : '🔐 Sign up to save'}
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <PreviewFrame craftJson={craftJson} colorScheme={selectedPreset?.colorScheme ?? 'dark'} />
        </div>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← {contract.step === 1 ? 'Home' : 'Back'}
        </button>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Step {contract.step} of {totalSteps}</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', overflow: 'auto' }}>

        {contract.step === 1 && (
          <div style={{ width: '100%', maxWidth: 860, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>What&apos;s your business?</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Choose the category that best describes your project</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
              {BUSINESS_TYPES.map(bt => {
                const isSelected = contract.businessType === bt.id;
                return (
                  <button key={bt.id} onClick={() => setContract(prev => ({ ...prev, businessType: bt.id }))}
                    style={{
                      padding: 0, borderRadius: 12, overflow: 'hidden',
                      border: isSelected ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                      background: 'transparent', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 20px ${accentColor}40` : 'none',
                      position: 'relative',
                    }}>
                    <BusinessTypeThumbnail id={bt.id} />
                    <div style={{
                      padding: '8px 10px', background: isSelected ? `rgba(${hexToRgb(accentColor)}, 0.1)` : 'rgba(255,255,255,0.03)',
                      textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>{bt.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? accentColor : 'rgba(255,255,255,0.7)' }}>{bt.label}</span>
                    </div>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Color presets ── */}
        {contract.step === 2 && (
          <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose your vibe</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Each palette sets the mood for your entire website</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
              {COLOR_PRESETS.map(preset => {
                const isSelected = contract.presetId === preset.id;
                return (
                  <button key={preset.id}
                    onClick={() => setContract(prev => ({ ...prev, presetId: preset.id }))}
                    style={{
                      padding: 0, borderRadius: 14, overflow: 'hidden',
                      border: isSelected ? `2px solid ${preset.accentColor}` : '1px solid rgba(255,255,255,0.08)',
                      background: 'transparent', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 20px ${preset.accentColor}40` : 'none',
                    }}
                  >
                    {/* Color preview bar */}
                    <div style={{
                      height: 56, background: preset.darkBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative',
                    }}>
                      {/* Mini site preview */}
                      <div style={{ width: 80, height: 44, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ height: 8, background: preset.darkBg, display: 'flex', alignItems: 'center', padding: '0 4px', gap: 2 }}>
                          <div style={{ width: 8, height: 4, borderRadius: 2, background: preset.accentColor, opacity: 0.9 }} />
                          <div style={{ width: 18, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.2)' }} />
                        </div>
                        <div style={{ height: 20, background: preset.darkBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <div style={{ width: 40, height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.7)' }} />
                          <div style={{ width: 30, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <div style={{ height: 16, background: preset.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 28, height: 8, borderRadius: 4, background: preset.accentColor }} />
                        </div>
                      </div>
                      {/* Accent dot */}
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: preset.accentColor, boxShadow: `0 0 12px ${preset.accentColor}80`, flexShrink: 0 }} />
                    </div>
                    {/* Label */}
                    <div style={{
                      padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
                      textAlign: 'left', borderTop: `1px solid rgba(255,255,255,0.06)`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{preset.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{preset.tagline}</div>
                    </div>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: preset.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Block selection with thumbnails ── */}
        {contract.step === 3 && (() => {
          const optionalSelected = contract.blocks.filter(id => id !== 'header' && id !== 'hero' && id !== 'footer');
          return (
            <div style={{ width: '100%', maxWidth: 760, textAlign: 'center' }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose sections</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Header, Hero and Footer are always included</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {BLOCKS.map(b => {
                  const isSelected = contract.blocks.includes(b.id);
                  const isFooter = b.id === 'footer';
                  const isHeaderOrHero = b.id === 'header' || b.id === 'hero';
                  const positionIndex = !isFooter && !isHeaderOrHero ? optionalSelected.indexOf(b.id) : -1;

                  return (
                    <button key={b.id} onClick={() => toggleBlock(b.id)}
                      style={{
                        position: 'relative', padding: '8px 8px 10px', borderRadius: 10,
                        border: isSelected ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? `rgba(${hexToRgb(accentColor)}, 0.08)` : 'rgba(255,255,255,0.02)',
                        color: '#fff', cursor: b.required ? 'default' : 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8,
                        transition: 'all 0.15s ease', opacity: b.required ? 0.7 : 1,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Position badge */}
                      {positionIndex !== -1 && (
                        <span style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, fontSize: 10, fontWeight: 800, color: accentColor, background: `rgba(${hexToRgb(accentColor)}, 0.2)`, borderRadius: 4, padding: '1px 5px', lineHeight: 1.4 }}>
                          {positionIndex + 1}
                        </span>
                      )}
                      {isFooter && (
                        <span style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 5px', lineHeight: 1.4 }}>last</span>
                      )}
                      {/* Thumbnail */}
                      <BlockThumbnail blockId={b.id} accent={accentColor} />
                      {/* Label */}
                      <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? accentColor : 'rgba(255,255,255,0.7)' }}>
                        {b.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: 16, fontSize: 13 }}>
                {contract.blocks.length} sections selected
              </p>
            </div>
          );
        })()}

        {/* ── Step 4: Company name ── */}
        {contract.step === 4 && (
          <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Almost done!</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Enter your company or project name</p>
            <input type="text" value={contract.companyName}
              onChange={(e) => setContract(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="My Awesome Business" maxLength={50} autoFocus
              style={{ width: '100%', padding: '16px 20px', borderRadius: 12, border: `1px solid ${accentColor}40`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 18, fontWeight: 600, textAlign: 'center', outline: 'none' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: 12, fontSize: 13 }}>{contract.companyName.length}/50 characters</p>
            {/* Summary */}
            <div style={{ marginTop: 32, padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', fontSize: 13 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your website</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: `rgba(${hexToRgb(accentColor)}, 0.15)`, color: accentColor, fontSize: 12 }}>
                  {BUSINESS_TYPES.find(b => b.id === contract.businessType)?.emoji} {BUSINESS_TYPES.find(b => b.id === contract.businessType)?.label}
                </span>
                {selectedPreset && (
                  <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedPreset.accentColor, display: 'inline-block' }} />
                    {selectedPreset.name}
                  </span>
                )}
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {contract.blocks.length} sections
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <button onClick={handleNext} disabled={!canProceed()}
          style={{
            padding: '14px 48px', borderRadius: 100, border: 'none',
            background: canProceed() ? `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` : 'rgba(255,255,255,0.08)',
            color: canProceed() ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 700, cursor: canProceed() ? 'pointer' : 'default',
            transition: 'all 0.2s ease', minWidth: 200,
          }}>
          {contract.step === totalSteps ? '🚀 Create Website' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// Helper
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}
