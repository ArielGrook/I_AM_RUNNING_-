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
    startX: ((i * 7.3 + Math.sin(i) * 15 + 100) % 115) - 5,
    startY: ((i * 5.7 + Math.cos(i * 1.3) * 12 + 100) % 110),
    delay: -(((i / 120) * (32 + (i % 9) * 4)) + ((i % 5) * 3.1)),
    r0: (i % 7 - 3) * 8,
    r1: (i % 7 - 3) * 8 + (i % 5 - 2) * 12,
  })), []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', color: iconColor, transition: 'color 1.2s ease' }}>
      <style>{`@keyframes diagFloat{0%{opacity:0;transform:translate(0,0) rotate(var(--r0,0deg))}8%{opacity:var(--op,0.1)}92%{opacity:var(--op,0.1)}100%{opacity:0;transform:translate(-900px,-900px) rotate(var(--r1,20deg))}}`}</style>
      {items.map(item => (
        <div
          key={item.key}
          style={{
            position: 'absolute',
            bottom: `${item.startY}%`,
            right: `${-item.startX}%`,
            lineHeight: 0,
            animation: `diagFloat ${item.dur}s ${item.delay}s linear infinite`,
            ['--r0' as string]: `${item.r0}deg`,
            ['--r1' as string]: `${item.r1}deg`,
            ['--op' as string]: String(0.85 + (item.key % 3) * 0.075),
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

// ── DEPRECATED: BusinessTypeThumbnail replaced by inline icons ──────────
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
                      border: isSelected ? `2px solid ${bt.accentColor}` : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)'}`,
                      background: isDarkMode ? (isSelected ? '#222' : '#181818') : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 18px ${bt.accentColor}45` : 'none',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `radial-gradient(circle at 50% 60%, ${bt.accentColor}${isSelected ? '28' : '18'} 0%, transparent 70%)`,
                      transition: 'background 0.2s',
                    }}>
                      <svg
                        viewBox="0 0 24 24" width={26} height={26}
                        fill="none" stroke={bt.accentColor}
                        strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
                        style={{ opacity: 0.85 }}
                        dangerouslySetInnerHTML={{ __html: BUSINESS_TYPE_ICONS[bt.id] ?? '' }}
                      />
                    </div>
                    <div style={{
                      padding: '5px 6px 9px', textAlign: 'center',
                      borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, lineHeight: 1.3, display: 'block',
                        color: isSelected ? bt.accentColor : (isDarkMode ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.5)'),
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
