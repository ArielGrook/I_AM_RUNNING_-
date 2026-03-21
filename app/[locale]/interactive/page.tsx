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

// ── Assembler inner ──────────────────────────────────────────────────────
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

        {/* ── Step 1: Business type ── */}
        {contract.step === 1 && (
          <div style={{ width: '100%', maxWidth: 800, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>What&apos;s your business?</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Choose the category that best describes your project</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {BUSINESS_TYPES.map(bt => (
                <button key={bt.id} onClick={() => setContract(prev => ({ ...prev, businessType: bt.id }))}
                  style={{
                    padding: '16px 12px', borderRadius: 12,
                    border: contract.businessType === bt.id ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)',
                    background: contract.businessType === bt.id ? `rgba(${hexToRgb(accentColor)}, 0.12)` : 'rgba(255,255,255,0.03)',
                    color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.15s ease', fontSize: 13, fontWeight: 500,
                  }}>
                  <span style={{ fontSize: 28 }}>{bt.emoji}</span>
                  {bt.label}
                </button>
              ))}
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
