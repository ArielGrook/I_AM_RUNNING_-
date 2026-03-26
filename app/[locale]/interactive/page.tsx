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
  { id: 'food',          emoji: '🍕', label: 'Restaurant & Food',  accentColor: '#f97316' },
  { id: 'shop',          emoji: '🛍️', label: 'Shop & Retail',       accentColor: '#8b5cf6' },
  { id: 'ecommerce',     emoji: '🛒', label: 'Online Store',        accentColor: '#00bcd4' },
  { id: 'startup',       emoji: '🚀', label: 'Startup & Tech',      accentColor: '#84cc16' },
  { id: 'portfolio',     emoji: '💼', label: 'Portfolio',           accentColor: '#d97706' },
  { id: 'beauty',        emoji: '✨', label: 'Beauty & Spa',        accentColor: '#ec4899' },
  { id: 'health',        emoji: '💪', label: 'Health & Fitness',    accentColor: '#22c55e' },
  { id: 'education',     emoji: '📚', label: 'Education',           accentColor: '#3b82f6' },
  { id: 'agency',        emoji: '🏢', label: 'Agency',              accentColor: '#FF6B35' },
  { id: 'consulting',    emoji: '📊', label: 'Consulting',          accentColor: '#f59e0b' },
  { id: 'blog',          emoji: '✍️', label: 'Blog',               accentColor: '#94a3b8' },
  { id: 'event',         emoji: '🎉', label: 'Events',              accentColor: '#e11d48' },
  { id: 'real_estate',   emoji: '🏠', label: 'Real Estate',        accentColor: '#d97706' },
  { id: 'travel',        emoji: '✈️', label: 'Travel',             accentColor: '#0ea5e9' },
  { id: 'craft',         emoji: '🎨', label: 'Art & Craft',         accentColor: '#a855f7' },
  { id: 'business_card', emoji: '📇', label: 'Business Card',       accentColor: '#64748b' },
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

// ── Background icon paths (30 generic icons for animated background) ────
const BG_ICON_PATHS: string[] = [
  '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
  '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
  '<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
  '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
  '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>',
  '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  '<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>',
  '<path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
  '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',
  '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>',
  '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  '<path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"/>',
  '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  '<circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>',
  '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  '<path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"/>',
  '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>',
  '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  '<circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
  '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>',
];

// ── Per-niche card icons ─────────────────────────────────────────────────
const BUSINESS_TYPE_ICONS: Record<string, string> = {
  food:          '<path d="M7 3v5a2 2 0 004 0V3M9 8v13M15 3v18M13 3h4v4a2 2 0 01-4 0z"/>',
  shop:          '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>',
  ecommerce:     '<path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>',
  startup:       '<path d="M12 2s-6 7-6 12l6 3 6-3C18 9 12 2 12 2z"/><circle cx="12" cy="10" r="2"/>',
  portfolio:     '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  beauty:        '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
  health:        '<polyline points="3 12 7 12 9 6 11 18 13 12 21 12"/><circle cx="12" cy="4" r="2"/>',
  education:     '<path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12.5V17c3 3 9 3 12 0v-4.5"/><line x1="22" y1="10" x2="22" y2="16"/>',
  agency:        '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  consulting:    '<polyline points="3 20 9 14 13 18 22 7"/><line x1="3" y1="20" x2="22" y2="20"/>',
  blog:          '<path d="M11 4H4a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2 2 0 013 3L12 15l-4 1 1-4z"/>',
  event:         '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  real_estate:   '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  travel:        '<path d="M22 2L11 13M22 2L15 22l-4-9-9-4z"/>',
  craft:         '<path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5z"/>',
  business_card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="9" x2="10" y2="9"/><line x1="6" y1="13" x2="9" y2="13"/><circle cx="16" cy="12" r="3"/>',
};

// ── Niche → default color preset map ────────────────────────────────────
const NICHE_PRESET_MAP: Record<string, string> = {
  food:          'coral_sunset',
  shop:          'violet_storm',
  ecommerce:     'arctic_pulse',
  startup:       'cyber_lime',
  portfolio:     'obsidian_gold',
  beauty:        'rose_quartz',
  health:        'forest_night',
  education:     'ocean_mist',
  agency:        'midnight_ember',
  consulting:    'solar_flare',
  blog:          'pearl_minimal',
  event:         'crimson_dark',
  real_estate:   'obsidian_gold',
  travel:        'arctic_pulse',
  craft:         'violet_storm',
  business_card: 'pearl_minimal',
};

// ── Animated background (Step 1 only) ───────────────────────────────────
function AnimatedBackground({ accentColor, isDark }: { accentColor: string | null; isDark: boolean }) {
  const iconColor = accentColor
    ? accentColor + '55'
    : isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.09)';

  const items = React.useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    key: i,
    iconIdx: i % BG_ICON_PATHS.length,
    sz: 14 + (i % 7) * 4,
    dur: 32 + (i % 9) * 4,
    startX: (i * 6.8 + Math.sin(i * 1.7) * 18) % 130,
    startY: (i * 5.3 + Math.cos(i * 1.3) * 14) % 115,
    delay: -(((i / 140) * (34 + (i % 9) * 4)) + ((i % 5) * 3.2)),
    r0: (i % 7 - 3) * 8,
    r1: (i % 7 - 3) * 8 + (i % 5 - 2) * 12,
  })), []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', color: iconColor, transition: 'color 1.2s ease' }}>
      <style>{`@keyframes diagFloat{0%{opacity:0;transform:translate(0,0) rotate(var(--r0,0deg))}8%{opacity:var(--op,0.1)}92%{opacity:var(--op,0.1)}100%{opacity:0;transform:translate(-160vw,-140vh) rotate(var(--r1,20deg))}}`}</style>
      {items.map(item => (
        <div
          key={item.key}
          style={{
            position: 'absolute',
            bottom: `${item.startY}%`,
            left: `${item.startX}%`,
            lineHeight: 0,
            animation: `diagFloat ${item.dur}s ${item.delay}s linear infinite`,
            ['--r0' as string]: `${item.r0}deg`,
            ['--r1' as string]: `${item.r1}deg`,
            ['--op' as string]: String(0.10 + (item.key % 4) * 0.04),
          } as React.CSSProperties}
        >
          <svg
            viewBox="0 0 24 24"
            width={item.sz}
            height={item.sz}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: BG_ICON_PATHS[item.iconIdx] }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Niche detailed thumbnails ────────────────────────────────────────────
const NICHE_THUMBNAILS: Record<string, React.ReactNode> = {
  food: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#fff7ed'/><rect x='0' y='0' width='140' height='13' fill='#fed7aa'/><circle cx='10' cy='6.5' r='4' fill='#c2410c'/><rect x='20' y='5' width='22' height='4' rx='2' fill='#ea580c' opacity='.5'/><rect x='100' y='4' width='18' height='6' rx='3' fill='#ea580c'/><ellipse cx='70' cy='35' rx='24' ry='7' fill='#fed7aa'/><ellipse cx='65' cy='30' rx='8' ry='6' fill='#dc2626'/><ellipse cx='76' cy='31' rx='7' ry='5' fill='#16a34a'/><ellipse cx='70' cy='28' rx='6' ry='4' fill='#ea580c'/><path d='M54 22 Q56 18 54 15' stroke='#c2410c' strokeWidth='1.5' fill='none' strokeLinecap='round' opacity='.6'/><path d='M70 20 Q72 16 70 13' stroke='#c2410c' strokeWidth='1.5' fill='none' strokeLinecap='round' opacity='.6'/><path d='M86 22 Q88 18 86 15' stroke='#c2410c' strokeWidth='1.5' fill='none' strokeLinecap='round' opacity='.6'/><rect x='38' y='52' width='64' height='6' rx='2' fill='#7c2d12' opacity='.8'/><rect x='10' y='68' width='36' height='14' rx='3' fill='#fed7aa'/><rect x='12' y='72' width='24' height='3' rx='1' fill='#ea580c'/><rect x='52' y='68' width='36' height='14' rx='3' fill='#fed7aa'/><rect x='54' y='72' width='20' height='3' rx='1' fill='#f97316' opacity='.7'/><rect x='94' y='68' width='36' height='14' rx='3' fill='#fed7aa'/><rect x='96' y='72' width='22' height='3' rx='1' fill='#f97316' opacity='.7'/></svg>),
  shop: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#f5f3ff'/><rect x='0' y='0' width='140' height='13' fill='#ddd6fe'/><circle cx='10' cy='6.5' r='4' fill='#6d28d9'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#7c3aed' opacity='.5'/><rect x='108' y='3' width='24' height='7' rx='3.5' fill='#7c3aed'/><rect x='18' y='16' width='104' height='56' rx='3' fill='#ede9fe'/><rect x='18' y='16' width='104' height='14' rx='3' fill='#ddd6fe'/><rect x='18' y='16' width='26' height='14' fill='#8b5cf6' opacity='.5'/><rect x='44' y='16' width='26' height='14' fill='#7c3aed' opacity='.35'/><rect x='70' y='16' width='26' height='14' fill='#8b5cf6' opacity='.5'/><rect x='96' y='16' width='26' height='14' fill='#7c3aed' opacity='.35'/><rect x='48' y='21' width='44' height='3' rx='1' fill='#6d28d9' opacity='.7'/><rect x='22' y='34' width='30' height='22' rx='2' fill='#f5f3ff'/><rect x='88' y='34' width='30' height='22' rx='2' fill='#f5f3ff'/><rect x='26' y='37' width='8' height='12' rx='1' fill='#f59e0b' opacity='.9'/><rect x='36' y='39' width='7' height='10' rx='1' fill='#ec4899' opacity='.9'/><rect x='92' y='36' width='7' height='14' rx='1' fill='#22c55e' opacity='.9'/><rect x='101' y='38' width='8' height='12' rx='1' fill='#3b82f6' opacity='.9'/><rect x='57' y='34' width='26' height='28' rx='2' fill='#f5f3ff'/><circle cx='80' cy='48' r='1.5' fill='#9333ea' opacity='.5'/><rect x='18' y='72' width='104' height='8' fill='#ede9fe'/></svg>),
  ecommerce: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#f0f9ff'/><rect x='0' y='0' width='140' height='13' fill='#bae6fd'/><circle cx='10' cy='6.5' r='4' fill='#0369a1'/><rect x='20' y='4' width='20' height='4' rx='2' fill='#0284c7' opacity='.5'/><rect x='118' y='3' width='14' height='8' rx='4' fill='#0369a1'/><rect x='8' y='18' width='37' height='28' rx='3' fill='#e0f2fe'/><rect x='8' y='18' width='37' height='18' rx='3' fill='#fca5a5'/><rect x='12' y='40' width='20' height='2.5' rx='1' fill='#0369a1' opacity='.7'/><rect x='12' y='44' width='14' height='2' rx='1' fill='#0284c7' opacity='.5'/><rect x='52' y='18' width='37' height='28' rx='3' fill='#e0f2fe'/><rect x='52' y='18' width='37' height='18' rx='3' fill='#c4b5fd'/><rect x='56' y='40' width='20' height='2.5' rx='1' fill='#0369a1' opacity='.7'/><rect x='56' y='44' width='14' height='2' rx='1' fill='#0284c7' opacity='.5'/><rect x='96' y='18' width='37' height='28' rx='3' fill='#e0f2fe'/><rect x='96' y='18' width='37' height='18' rx='3' fill='#86efac'/><rect x='100' y='40' width='20' height='2.5' rx='1' fill='#0369a1' opacity='.7'/><rect x='100' y='44' width='14' height='2' rx='1' fill='#0284c7' opacity='.5'/><rect x='8' y='50' width='37' height='28' rx='3' fill='#e0f2fe'/><rect x='8' y='50' width='37' height='18' rx='3' fill='#fde68a'/><rect x='52' y='50' width='37' height='28' rx='3' fill='#e0f2fe'/><rect x='52' y='50' width='37' height='18' rx='3' fill='#fca5a5' opacity='.7'/><rect x='96' y='50' width='37' height='28' rx='3' fill='#e0f2fe'/><rect x='96' y='50' width='37' height='18' rx='3' fill='#7dd3fc'/></svg>),
  startup: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#f7fee7'/><rect x='0' y='0' width='140' height='13' fill='#d9f99d'/><circle cx='10' cy='6.5' r='4' fill='#3f6212'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#4d7c0f' opacity='.6'/><rect x='108' y='3' width='24' height='7' rx='3' fill='#4d7c0f'/><rect x='20' y='18' width='84' height='8' rx='2' fill='#3f6212' opacity='.85'/><rect x='20' y='29' width='65' height='5' rx='1.5' fill='#65a30d'/><rect x='20' y='37' width='50' height='5' rx='1.5' fill='#84cc16' opacity='.7'/><rect x='20' y='46' width='32' height='10' rx='5' fill='#4d7c0f'/><rect x='57' y='46' width='32' height='10' rx='5' fill='none' stroke='#65a30d' strokeWidth='1.5'/><path d='M116 40 L121 22 L126 40 Z' fill='#65a30d'/><rect x='118' y='37' width='6' height='16' rx='2' fill='#3f6212'/><ellipse cx='121' cy='55' rx='4' ry='6' fill='#a3e635' opacity='.9'/><ellipse cx='121' cy='55' rx='2.5' ry='4' fill='#ecfccb'/><circle cx='110' cy='20' r='2.5' fill='#84cc16' opacity='.7'/><circle cx='130' cy='32' r='2' fill='#a3e635' opacity='.6'/><rect x='8' y='62' width='28' height='18' rx='3' fill='#ecfccb'/><rect x='10' y='65' width='14' height='6' rx='1' fill='#84cc16'/><rect x='10' y='74' width='20' height='2.5' rx='1' fill='#4d7c0f' opacity='.5'/><rect x='42' y='62' width='28' height='18' rx='3' fill='#ecfccb'/><rect x='44' y='65' width='14' height='6' rx='1' fill='#65a30d'/><rect x='44' y='74' width='20' height='2.5' rx='1' fill='#4d7c0f' opacity='.5'/><rect x='76' y='62' width='28' height='18' rx='3' fill='#ecfccb'/><rect x='78' y='65' width='14' height='6' rx='1' fill='#4d7c0f'/><rect x='78' y='74' width='20' height='2.5' rx='1' fill='#4d7c0f' opacity='.5'/></svg>),
  portfolio: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#fffbeb'/><rect x='0' y='0' width='140' height='13' fill='#fde68a'/><circle cx='10' cy='6.5' r='4' fill='#92400e'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#b45309' opacity='.5'/><rect x='8' y='16' width='78' height='50' rx='4' fill='#fef3c7'/><circle cx='28' cy='36' r='14' fill='#f59e0b' opacity='.35'/><circle cx='50' cy='40' r='12' fill='#f97316' opacity='.3'/><circle cx='42' cy='24' r='10' fill='#dc2626' opacity='.25'/><path d='M14 48 Q28 36 42 44 Q56 52 70 40' fill='none' stroke='#b45309' strokeWidth='2.5' strokeLinecap='round'/><rect x='10' y='57' width='40' height='3' rx='1.5' fill='#92400e' opacity='.6'/><rect x='92' y='16' width='40' height='22' rx='3' fill='#fef3c7'/><ellipse cx='112' cy='27' rx='12' ry='8' fill='#f59e0b' opacity='.5'/><rect x='92' y='42' width='40' height='22' rx='3' fill='#fef3c7'/><ellipse cx='112' cy='53' rx='12' ry='8' fill='#f97316' opacity='.4'/><rect x='8' y='70' width='24' height='12' rx='2' fill='#fde68a'/><rect x='36' y='70' width='24' height='12' rx='2' fill='#fde68a'/><rect x='64' y='70' width='24' height='12' rx='2' fill='#fde68a'/><rect x='92' y='70' width='24' height='12' rx='2' fill='#fde68a'/><rect x='120' y='70' width='12' height='12' rx='2' fill='#f59e0b'/></svg>),
  beauty: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#fdf2f8'/><rect x='0' y='0' width='140' height='13' fill='#fbcfe8'/><circle cx='10' cy='6.5' r='4' fill='#be185d'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#db2777' opacity='.5'/><rect x='0' y='13' width='70' height='40' fill='#fce7f3'/><ellipse cx='35' cy='20' rx='8' ry='8' fill='#f9a8d4' opacity='.9'/><rect x='27' y='28' width='16' height='22' rx='4' fill='#fbcfe8'/><line x1='55' y1='15' x2='55' y2='21' stroke='#be185d' strokeWidth='1.5' opacity='.7'/><line x1='52' y1='18' x2='58' y2='18' stroke='#be185d' strokeWidth='1.5' opacity='.7'/><line x1='12' y1='16' x2='12' y2='22' stroke='#ec4899' strokeWidth='1.5' opacity='.6'/><line x1='9' y1='19' x2='15' y2='19' stroke='#ec4899' strokeWidth='1.5' opacity='.6'/><rect x='76' y='16' width='50' height='6' rx='2' fill='#831843' opacity='.7'/><rect x='76' y='25' width='40' height='3' rx='1.5' fill='#be185d' opacity='.5'/><rect x='76' y='44' width='28' height='7' rx='3.5' fill='#be185d'/><rect x='8' y='57' width='28' height='24' rx='3' fill='#fce7f3'/><rect x='8' y='57' width='28' height='14' rx='3' fill='#f9a8d4'/><rect x='42' y='57' width='28' height='24' rx='3' fill='#fce7f3'/><rect x='42' y='57' width='28' height='14' rx='3' fill='#ec4899' opacity='.5'/><rect x='76' y='57' width='28' height='24' rx='3' fill='#fce7f3'/><rect x='76' y='57' width='28' height='14' rx='3' fill='#f472b6' opacity='.55'/><rect x='110' y='57' width='22' height='24' rx='3' fill='#fce7f3'/><rect x='110' y='57' width='22' height='14' rx='3' fill='#f9a8d4' opacity='.7'/></svg>),
  health: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#f0fdf4'/><rect x='0' y='0' width='140' height='13' fill='#bbf7d0'/><circle cx='10' cy='6.5' r='4' fill='#15803d'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#16a34a' opacity='.5'/><rect x='8' y='16' width='124' height='36' rx='4' fill='#dcfce7'/><polyline points='12,36 24,36 30,22 36,48 42,30 48,34 56,34 62,34 68,34 74,20 80,46 86,34 98,34 110,34 120,26 128,34 132,34' fill='none' stroke='#16a34a' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'/><polyline points='12,36 24,36 30,22 36,48 42,30 48,34 56,34 62,34 68,34 74,20 80,46 86,34 98,34 110,34 120,26 128,34 132,34' fill='none' stroke='#4ade80' strokeWidth='7' strokeLinecap='round' strokeLinejoin='round' opacity='.12'/><rect x='10' y='19' width='14' height='7' rx='1' fill='#4ade80'/><rect x='26' y='20' width='22' height='5' rx='1' fill='#15803d' opacity='.5'/><rect x='8' y='57' width='36' height='22' rx='3' fill='#dcfce7'/><rect x='10' y='60' width='16' height='7' rx='1' fill='#16a34a'/><rect x='10' y='70' width='28' height='2.5' rx='1' fill='#15803d' opacity='.4'/><rect x='52' y='57' width='36' height='22' rx='3' fill='#dcfce7'/><rect x='54' y='60' width='16' height='7' rx='1' fill='#15803d'/><rect x='54' y='70' width='28' height='2.5' rx='1' fill='#15803d' opacity='.4'/><rect x='96' y='57' width='36' height='22' rx='3' fill='#dcfce7'/><rect x='98' y='60' width='16' height='7' rx='1' fill='#4ade80' opacity='.9'/><rect x='98' y='70' width='28' height='2.5' rx='1' fill='#15803d' opacity='.4'/></svg>),
  education: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#eff6ff'/><rect x='0' y='0' width='140' height='13' fill='#bfdbfe'/><circle cx='10' cy='6.5' r='4' fill='#1d4ed8'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#2563eb' opacity='.5'/><rect x='108' y='3' width='24' height='7' rx='3.5' fill='#1d4ed8'/><rect x='8' y='18' width='60' height='38' rx='4' fill='#dbeafe'/><rect x='8' y='18' width='60' height='22' rx='4' fill='#93c5fd'/><rect x='28' y='24' width='20' height='3' rx='1' fill='white' opacity='.8'/><path d='M38 27 L46 23 L38 19 L30 23 Z' fill='white' opacity='.7'/><rect x='44' y='22' width='1.5' height='8' rx='.75' fill='white' opacity='.6'/><rect x='12' y='43' width='40' height='3' rx='1.5' fill='#1d4ed8' opacity='.6'/><rect x='12' y='48' width='28' height='2.5' rx='1' fill='#3b82f6' opacity='.4'/><rect x='12' y='52' width='20' height='5' rx='2.5' fill='#1d4ed8'/><rect x='35' y='52' width='4' height='3' rx='.5' fill='#fbbf24' opacity='.9'/><rect x='41' y='52' width='4' height='3' rx='.5' fill='#fbbf24' opacity='.9'/><rect x='47' y='52' width='4' height='3' rx='.5' fill='#fbbf24' opacity='.6'/><rect x='74' y='18' width='58' height='17' rx='3' fill='#dbeafe'/><rect x='74' y='18' width='28' height='17' rx='3' fill='#93c5fd'/><rect x='106' y='21' width='22' height='3' rx='1' fill='#1d4ed8' opacity='.6'/><rect x='106' y='27' width='16' height='2' rx='1' fill='#3b82f6' opacity='.4'/><rect x='74' y='40' width='58' height='17' rx='3' fill='#dbeafe'/><rect x='74' y='40' width='28' height='17' rx='3' fill='#bfdbfe'/><rect x='106' y='43' width='22' height='3' rx='1' fill='#1d4ed8' opacity='.6'/><rect x='8' y='62' width='124' height='6' rx='3' fill='#dbeafe'/><rect x='8' y='62' width='78' height='6' rx='3' fill='#3b82f6' opacity='.5'/><rect x='8' y='72' width='124' height='6' rx='3' fill='#dbeafe'/><rect x='8' y='72' width='50' height='6' rx='3' fill='#60a5fa' opacity='.5'/><rect x='8' y='82' width='124' height='6' rx='3' fill='#dbeafe'/><rect x='8' y='82' width='95' height='6' rx='3' fill='#93c5fd' opacity='.6'/></svg>),
  agency: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#fff7ed'/><rect x='0' y='0' width='140' height='13' fill='#fed7aa'/><circle cx='10' cy='6.5' r='4' fill='#c2410c'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#ea580c' opacity='.5'/><rect x='35' y='16' width='70' height='58' rx='2' fill='#ffedd5'/><rect x='35' y='12' width='70' height='8' rx='2' fill='#fed7aa'/><rect x='41' y='20' width='16' height='10' rx='1' fill='#f97316' opacity='.9'/><rect x='63' y='20' width='16' height='10' rx='1' fill='#ff6b35' opacity='.95'/><rect x='85' y='20' width='16' height='10' rx='1' fill='#ea580c' opacity='.6'/><rect x='41' y='34' width='16' height='10' rx='1' fill='#ea580c' opacity='.5'/><rect x='63' y='34' width='16' height='10' rx='1' fill='#f97316' opacity='.95'/><rect x='85' y='34' width='16' height='10' rx='1' fill='#fb923c' opacity='.8'/><rect x='41' y='48' width='16' height='10' rx='1' fill='#f97316' opacity='.7'/><rect x='63' y='48' width='16' height='10' rx='1' fill='#c2410c' opacity='.5'/><rect x='85' y='48' width='16' height='10' rx='1' fill='#ea580c' opacity='.7'/><rect x='57' y='60' width='26' height='14' rx='1' fill='#fed7aa'/><rect x='43' y='14' width='54' height='4' rx='1' fill='#c2410c' opacity='.7'/><rect x='8' y='30' width='24' height='42' rx='1' fill='#ffedd5'/><rect x='12' y='34' width='8' height='6' rx='1' fill='#fb923c' opacity='.6'/><rect x='12' y='44' width='8' height='6' rx='1' fill='#f97316' opacity='.5'/><rect x='108' y='36' width='24' height='36' rx='1' fill='#ffedd5'/><rect x='112' y='40' width='8' height='6' rx='1' fill='#fb923c' opacity='.5'/><rect x='0' y='76' width='140' height='12' fill='#ffedd5'/><rect x='0' y='76' width='140' height='1' fill='#fed7aa'/></svg>),
  consulting: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#fffbeb'/><rect x='0' y='0' width='140' height='13' fill='#fde68a'/><circle cx='10' cy='6.5' r='4' fill='#b45309'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#d97706' opacity='.5'/><rect x='8' y='16' width='86' height='56' rx='4' fill='#fef3c7'/><rect x='18' y='52' width='12' height='14' rx='1' fill='#3b82f6'/><rect x='34' y='42' width='12' height='24' rx='1' fill='#3b82f6' opacity='.8'/><rect x='50' y='32' width='12' height='34' rx='1' fill='#16a34a'/><rect x='66' y='25' width='12' height='41' rx='1' fill='#16a34a'/><rect x='82' y='20' width='8' height='46' rx='1' fill='#f59e0b'/><polyline points='24,52 40,42 56,32 72,25 86,18' fill='none' stroke='#dc2626' strokeWidth='2' strokeLinecap='round' strokeDasharray='3,2'/><circle cx='86' cy='18' r='3' fill='#dc2626'/><line x1='14' y1='66' x2='90' y2='66' stroke='#92400e' strokeWidth='1' opacity='.3'/><line x1='14' y1='20' x2='14' y2='66' stroke='#92400e' strokeWidth='1' opacity='.3'/><rect x='100' y='16' width='32' height='14' rx='3' fill='#fde68a'/><rect x='104' y='19' width='14' height='5' rx='1' fill='#f59e0b'/><rect x='104' y='26' width='20' height='2' rx='1' fill='#b45309' opacity='.4'/><rect x='100' y='34' width='32' height='14' rx='3' fill='#fde68a'/><rect x='104' y='37' width='14' height='5' rx='1' fill='#16a34a'/><rect x='104' y='44' width='20' height='2' rx='1' fill='#b45309' opacity='.4'/><rect x='100' y='52' width='32' height='14' rx='3' fill='#fde68a'/><rect x='104' y='55' width='14' height='5' rx='1' fill='#dc2626' opacity='.8'/><rect x='104' y='62' width='20' height='2' rx='1' fill='#b45309' opacity='.4'/></svg>),
  blog: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#f8fafc'/><rect x='0' y='0' width='140' height='13' fill='#e2e8f0'/><circle cx='10' cy='6.5' r='4' fill='#475569'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#64748b' opacity='.5'/><rect x='8' y='16' width='124' height='34' rx='3' fill='#f1f5f9'/><rect x='8' y='28' width='124' height='22' fill='#cbd5e1' opacity='.4'/><circle cx='110' cy='28' r='8' fill='#fbbf24' opacity='.5'/><path d='M8 38 Q30 28 55 34 Q80 40 105 30 Q120 24 132 28 L132 50 L8 50 Z' fill='#16a34a' opacity='.25'/><rect x='12' y='18' width='28' height='7' rx='3.5' fill='#64748b' opacity='.7'/><rect x='8' y='53' width='90' height='6' rx='2' fill='#1e293b' opacity='.7'/><rect x='8' y='62' width='110' height='3' rx='1.5' fill='#64748b' opacity='.4'/><rect x='8' y='67' width='96' height='3' rx='1.5' fill='#94a3b8' opacity='.4'/><circle cx='14' cy='78' r='5' fill='#475569' opacity='.6'/><rect x='22' y='75' width='24' height='3' rx='1.5' fill='#475569' opacity='.5'/><rect x='102' y='75' width='30' height='7' rx='3.5' fill='#e2e8f0'/></svg>),
  event: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#fff1f2'/><rect x='0' y='0' width='140' height='13' fill='#fecdd3'/><circle cx='10' cy='6.5' r='4' fill='#be123c'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#e11d48' opacity='.5'/><path d='M15 72 L30 32 L55 32 L45 72 Z' fill='#fda4af' opacity='.3'/><path d='M50 72 L60 32 L80 32 L72 72 Z' fill='#fb7185' opacity='.25'/><path d='M85 72 L88 32 L110 32 L108 72 Z' fill='#fda4af' opacity='.3'/><rect x='20' y='62' width='100' height='7' rx='2' fill='#fecdd3'/><circle cx='25' cy='18' r='4' fill='#fbbf24' opacity='.9'/><circle cx='55' cy='14' r='4' fill='#fbbf24' opacity='.9'/><circle cx='85' cy='14' r='4' fill='#fbbf24' opacity='.9'/><circle cx='115' cy='18' r='4' fill='#fbbf24' opacity='.9'/><circle cx='70' cy='52' r='5' fill='#fda4af' opacity='.7'/><rect x='67' y='57' width='6' height='8' rx='2' fill='#fecdd3'/><circle cx='30' cy='72' r='4' fill='#fda4af' opacity='.5'/><circle cx='44' cy='70' r='4' fill='#fb7185' opacity='.4'/><circle cx='58' cy='72' r='4' fill='#fda4af' opacity='.5'/><circle cx='82' cy='70' r='4' fill='#fb7185' opacity='.4'/><circle cx='96' cy='72' r='4' fill='#fda4af' opacity='.5'/><circle cx='110' cy='70' r='4' fill='#fb7185' opacity='.4'/><rect x='35' y='22' width='4' height='4' rx='1' fill='#e11d48' opacity='.8' transform='rotate(20 37 24)'/><rect x='72' y='19' width='4' height='4' rx='1' fill='#3b82f6' opacity='.8' transform='rotate(-15 74 21)'/><rect x='95' y='24' width='4' height='4' rx='1' fill='#16a34a' opacity='.8' transform='rotate(30 97 26)'/><rect x='100' y='34' width='32' height='22' rx='3' fill='#fecdd3'/><rect x='100' y='34' width='32' height='8' rx='3' fill='#be123c' opacity='.8'/><rect x='104' y='36' width='20' height='3' rx='1' fill='white' opacity='.8'/></svg>),
  real_estate: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#fffbeb'/><rect x='0' y='0' width='140' height='13' fill='#fde68a'/><circle cx='10' cy='6.5' r='4' fill='#92400e'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#b45309' opacity='.5'/><rect x='8' y='16' width='84' height='50' rx='4' fill='#fef3c7'/><rect x='8' y='16' width='84' height='25' rx='4' fill='#bfdbfe' opacity='.6'/><circle cx='76' cy='24' r='7' fill='#fbbf24' opacity='.6'/><path d='M30 41 L50 26 L70 41 Z' fill='#fde68a'/><rect x='33' y='41' width='34' height='20' rx='1' fill='#fef3c7'/><rect x='42' y='49' width='10' height='12' rx='1' fill='#fde68a'/><rect x='35' y='43' width='8' height='6' rx='1' fill='#f59e0b' opacity='.5'/><rect x='55' y='43' width='8' height='6' rx='1' fill='#f59e0b' opacity='.5'/><circle cx='20' cy='55' r='6' fill='#16a34a' opacity='.6'/><rect x='19' y='58' width='2' height='6' fill='#92400e' opacity='.4'/><circle cx='80' cy='57' r='5' fill='#16a34a' opacity='.5'/><rect x='10' y='54' width='30' height='10' rx='2' fill='#f59e0b'/><rect x='12' y='57' width='20' height='3' rx='1' fill='white' opacity='.9'/><rect x='98' y='16' width='34' height='22' rx='3' fill='#fef3c7'/><rect x='98' y='16' width='34' height='13' rx='3' fill='#fde68a'/><path d='M104 29 L111 22 L118 29 Z' fill='#f59e0b' opacity='.6'/><rect x='101' y='32' width='22' height='2.5' rx='1' fill='#92400e' opacity='.5'/><rect x='98' y='42' width='34' height='22' rx='3' fill='#fef3c7'/><rect x='98' y='42' width='34' height='13' rx='3' fill='#fde68a'/><path d='M104 55 L111 48 L118 55 Z' fill='#f59e0b' opacity='.5'/><rect x='8' y='70' width='20' height='8' rx='4' fill='#f59e0b'/><rect x='32' y='70' width='20' height='8' rx='4' fill='#fde68a'/><rect x='56' y='70' width='20' height='8' rx='4' fill='#fde68a'/></svg>),
  travel: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#f0f9ff'/><rect x='0' y='0' width='140' height='13' fill='#bae6fd'/><circle cx='10' cy='6.5' r='4' fill='#0369a1'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#0284c7' opacity='.5'/><rect x='0' y='13' width='140' height='40' fill='#e0f2fe'/><rect x='0' y='13' width='140' height='20' fill='#bae6fd' opacity='.6'/><circle cx='100' cy='22' r='9' fill='#fbbf24' opacity='.8'/><ellipse cx='30' cy='20' rx='14' ry='5' fill='white' opacity='.7'/><path d='M0 53 L20 28 L40 53 Z' fill='#0284c7' opacity='.5'/><path d='M25 53 L52 20 L79 53 Z' fill='#0369a1' opacity='.7'/><path d='M65 53 L88 32 L111 53 Z' fill='#0284c7' opacity='.5'/><path d='M52 20 L46 32 L58 32 Z' fill='white' opacity='.7'/><rect x='0' y='53' width='140' height='10' fill='#38bdf8' opacity='.35'/><path d='M60 35 L70 30 L72 33 L63 38 Z' fill='white'/><rect x='8' y='66' width='38' height='16' rx='3' fill='#e0f2fe'/><rect x='8' y='66' width='38' height='9' rx='3' fill='#bae6fd'/><rect x='12' y='78' width='22' height='2' rx='1' fill='#0369a1' opacity='.5'/><rect x='52' y='66' width='38' height='16' rx='3' fill='#e0f2fe'/><rect x='52' y='66' width='38' height='9' rx='3' fill='#7dd3fc' opacity='.7'/><rect x='96' y='66' width='38' height='16' rx='3' fill='#e0f2fe'/><rect x='96' y='66' width='38' height='9' rx='3' fill='#bae6fd'/></svg>),
  craft: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#faf5ff'/><rect x='0' y='0' width='140' height='13' fill='#e9d5ff'/><circle cx='10' cy='6.5' r='4' fill='#7c3aed'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#9333ea' opacity='.5'/><rect x='28' y='14' width='68' height='52' rx='2' fill='#ede9fe' stroke='#c4b5fd' strokeWidth='1'/><circle cx='48' cy='32' r='13' fill='#c084fc' opacity='.55'/><circle cx='66' cy='37' r='11' fill='#818cf8' opacity='.5'/><circle cx='58' cy='22' r='9' fill='#f43f5e' opacity='.4'/><path d='M32 46 Q46 34 58 42 Q70 50 82 38' fill='none' stroke='#7c3aed' strokeWidth='3' strokeLinecap='round'/><path d='M36 54 Q50 46 62 52 Q74 58 84 50' fill='none' stroke='#f59e0b' strokeWidth='2' strokeLinecap='round'/><circle cx='44' cy='24' r='3' fill='#fbbf24'/><circle cx='76' cy='30' r='3' fill='#34d399'/><circle cx='70' cy='50' r='2.5' fill='#f43f5e'/><line x1='28' y1='66' x2='18' y2='78' stroke='#9333ea' strokeWidth='1.5' strokeLinecap='round' opacity='.5'/><line x1='96' y1='66' x2='106' y2='78' stroke='#9333ea' strokeWidth='1.5' strokeLinecap='round' opacity='.5'/><line x1='62' y1='66' x2='62' y2='78' stroke='#9333ea' strokeWidth='1.5' strokeLinecap='round' opacity='.5'/><ellipse cx='118' cy='40' rx='10' ry='13' fill='#ede9fe' stroke='#c4b5fd' strokeWidth='.5'/><circle cx='113' cy='32' r='3.5' fill='#f43f5e'/><circle cx='120' cy='30' r='3.5' fill='#3b82f6'/><circle cx='124' cy='37' r='3.5' fill='#22c55e'/><circle cx='122' cy='45' r='3.5' fill='#fbbf24'/><circle cx='114' cy='47' r='3.5' fill='#a855f7'/><rect x='8' y='20' width='3' height='22' rx='1.5' fill='#7c3aed' opacity='.6'/><path d='M7 20 L11 20 L10 14 Z' fill='#a855f7'/><rect x='14' y='26' width='3' height='18' rx='1.5' fill='#9333ea' opacity='.5'/><path d='M13 26 L17 26 L16 20 Z' fill='#f43f5e'/></svg>),
  business_card: (<svg viewBox='0 0 140 88' xmlns='http://www.w3.org/2000/svg' style={{width:'100%',display:'block'}}><rect width='140' height='88' fill='#f8fafc'/><rect x='0' y='0' width='140' height='13' fill='#e2e8f0'/><circle cx='10' cy='6.5' r='4' fill='#475569'/><rect x='20' y='4' width='22' height='4' rx='2' fill='#64748b' opacity='.5'/><rect x='18' y='24' width='108' height='54' rx='5' fill='#f1f5f9' transform='rotate(3 72 51)'/><rect x='16' y='20' width='108' height='54' rx='5' fill='#f8fafc' stroke='#e2e8f0' strokeWidth='1'/><rect x='16' y='20' width='5' height='54' rx='5' fill='#64748b' opacity='.4'/><circle cx='46' cy='42' r='14' fill='#cbd5e1' opacity='.8'/><circle cx='46' cy='38' r='6' fill='#94a3b8' opacity='.6'/><ellipse cx='46' cy='52' rx='9' ry='6' fill='#94a3b8' opacity='.4'/><rect x='68' y='26' width='44' height='7' rx='2' fill='#1e293b' opacity='.65'/><rect x='68' y='36' width='32' height='4' rx='1.5' fill='#64748b' opacity='.6'/><line x1='68' y1='44' x2='116' y2='44' stroke='#e2e8f0' strokeWidth='1'/><rect x='68' y='47' width='4' height='4' rx='1' fill='#64748b' opacity='.4'/><rect x='75' y='48' width='30' height='2.5' rx='1' fill='#475569' opacity='.3'/><rect x='68' y='54' width='4' height='4' rx='1' fill='#64748b' opacity='.4'/><rect x='75' y='55' width='24' height='2.5' rx='1' fill='#475569' opacity='.3'/><rect x='68' y='61' width='4' height='4' rx='1' fill='#64748b' opacity='.4'/><rect x='75' y='62' width='28' height='2.5' rx='1' fill='#475569' opacity='.3'/><rect x='100' y='53' width='14' height='14' rx='2' fill='#e2e8f0'/><rect x='102' y='55' width='4' height='4' rx='.5' fill='#94a3b8'/><rect x='108' y='55' width='4' height='4' rx='.5' fill='#94a3b8'/><rect x='102' y='61' width='4' height='4' rx='.5' fill='#94a3b8'/></svg>),
};
function BusinessTypeThumbnail({ id }: { id: string }) {
  const t = NICHE_THUMBNAILS[id];
  if (!t) return <div style={{ width: '100%', height: 88, background: '#111', borderRadius: 8 }} />;
  return <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }}>{t}</div>;
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

  const [isDarkMode, setIsDarkMode] = useState(true);

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

  // Assembling
  if (assembling && !craftJson) {
    const preset = selectedPreset;
    const interactiveContract: InteractiveContract = {
      businessType: contract.businessType!,
      style: preset?.colorScheme === 'dark' ? 'dark' : 'light',
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
          <ThemeProvider initialAccent={preset?.accentColor ?? '#FF6B35'} initialScheme={preset?.colorScheme ?? 'light'}>
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
          <PreviewFrame craftJson={craftJson} colorScheme={selectedPreset?.colorScheme ?? 'light'} />
        </div>
      </div>
    );
  }

  const step1BgColor = isDarkMode ? '#0d0d0d' : '#f2eeea';
  const step1TextColor = isDarkMode ? '#fff' : '#111';
  const bgAccent = contract.businessType
    ? (COLOR_PRESETS.find(p => p.id === NICHE_PRESET_MAP[contract.businessType!])?.accentColor ?? null)
    : null;

  // ── Wizard ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: contract.step === 1 ? step1BgColor : '#0a0a0a', color: contract.step === 1 ? step1TextColor : '#fff', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'background 0.35s ease, color 0.3s ease' }}>
      {contract.step === 1 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <AnimatedBackground accentColor={bgAccent} isDark={isDarkMode} />
        </div>
      )}
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: contract.step === 1 ? (isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)') : 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← {contract.step === 1 ? 'Home' : 'Back'}
        </button>
        <div style={{ fontSize: 13, color: contract.step === 1 ? (isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') : 'rgba(255,255,255,0.4)' }}>Step {contract.step} of {totalSteps}</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', overflow: 'auto', position: 'relative', zIndex: 1 }}>

        {contract.step === 1 && (
          <div style={{ width: '100%', maxWidth: 900 }}>
            {/* Toggle + heading */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: isDarkMode ? '#fff' : '#111' }}>What&apos;s your business?</h1>
                <p style={{ fontSize: 13, color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', margin: '4px 0 0' }}>Choose the category that best describes your project</p>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  flexShrink: 0, marginLeft: 16,
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 20, color: isDarkMode ? '#fff' : '#111',
                  padding: '5px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  transition: 'all 0.2s ease',
                }}
              >
                {isDarkMode ? '☀ Light' : '● Dark'}
              </button>
            </div>
            {/* Card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 9 }}>
              {BUSINESS_TYPES.map(bt => {
                const isSelected = contract.businessType === bt.id;
                return (
                  <button
                    key={bt.id}
                    onClick={() => setContract(prev => ({
                      ...prev,
                      businessType: bt.id,
                      presetId: NICHE_PRESET_MAP[bt.id] ?? prev.presetId,
                    }))}
                    style={{
                      padding: 0, borderRadius: 10, overflow: 'hidden',
                      border: isSelected ? `2px solid ${bt.accentColor}` : '1px solid rgba(0,0,0,0.10)',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 18px ${bt.accentColor}45` : 'none',
                      position: 'relative',
                    }}
                  >
                    <BusinessTypeThumbnail id={bt.id} />
                    <div style={{
                      padding: '5px 6px 9px', textAlign: 'center',
                      borderTop: '1px solid rgba(0,0,0,0.07)',
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, lineHeight: 1.3, display: 'block',
                        color: isSelected ? bt.accentColor : 'rgba(0,0,0,0.55)',
                      }}>{bt.label}</span>
                    </div>
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 5, right: 5,
                        width: 15, height: 15, borderRadius: '50%',
                        background: bt.accentColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 900, color: '#fff', lineHeight: 1,
                      }}>✓</div>
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
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
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
