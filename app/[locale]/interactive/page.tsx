'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import lz from 'lzutf8';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { buildElementsFromContract, InteractiveContract } from '@/lib/craft/assembler';

// Import all resolver components (same as editor)
import {
  Container,
  HeroTron, HeroTronHeading, HeroTronSubheading, HeroTronButton,
  HeaderTron, TronFeatures, FeatureCard, TronStats, TronAbout, StatItem,
  TronPortfolio, TronTestimonials, TestimonialCard, TronPricing, PricingCard,
  TronFAQ, FAQItem, TronFooter, FooterColumn, TronContact, TronShowcase,
  TronLogin, TronRegister, TronHub, HtmlBlock,
} from '@/lib/craft/components';
import { ThemeProvider } from '@/lib/craft/context/ThemeContext';
import { SiteContext } from '@/lib/craft/context/SiteContext';

const resolver = {
  Container, HeroTron, HeroTronHeading, HeroTronSubheading, HeroTronButton,
  HeaderTron, TronFeatures, FeatureCard, TronStats, TronAbout, StatItem,
  TronPortfolio, TronTestimonials, TestimonialCard, TronPricing, PricingCard,
  TronFAQ, FAQItem, TronFooter, FooterColumn, TronContact, TronShowcase,
  TronLogin, TronRegister, TronHub, HtmlBlock,
};

// ── Types ──────────────────────────────────────────
interface ContractState {
  businessType: string | null;
  style: string | null;
  blocks: string[];
  companyName: string;
  step: number;
}

const BUSINESS_TYPES = [
  { id: 'food', emoji: '🍕', label: 'Restaurant & Food' },
  { id: 'shop', emoji: '🛍️', label: 'Shop & Retail' },
  { id: 'ecommerce', emoji: '🛒', label: 'Online Store' },
  { id: 'startup', emoji: '🚀', label: 'Startup & Tech' },
  { id: 'portfolio', emoji: '💼', label: 'Portfolio' },
  { id: 'beauty', emoji: '✨', label: 'Beauty & Spa' },
  { id: 'health', emoji: '💪', label: 'Health & Fitness' },
  { id: 'education', emoji: '📚', label: 'Education' },
  { id: 'agency', emoji: '🏢', label: 'Agency' },
  { id: 'consulting', emoji: '📊', label: 'Consulting' },
  { id: 'blog', emoji: '✍️', label: 'Blog' },
  { id: 'event', emoji: '🎉', label: 'Events' },
  { id: 'real_estate', emoji: '🏠', label: 'Real Estate' },
  { id: 'travel', emoji: '✈️', label: 'Travel' },
  { id: 'craft', emoji: '🎨', label: 'Art & Craft' },
  { id: 'business_card', emoji: '📇', label: 'Business Card' },
];

const STYLES = [
  { id: 'dark', label: 'Dark', color: '#0a0a0a' },
  { id: 'light', label: 'Light', color: '#ffffff' },
  { id: 'minimal', label: 'Minimal', color: '#f5f5f5' },
  { id: 'bold', label: 'Bold', color: '#ff4500' },
  { id: 'elegant', label: 'Elegant', color: '#1a1a2e' },
  { id: 'neon_futuristic', label: 'Neon', color: '#0f0f23' },
];

const BLOCKS = [
  { id: 'header', label: 'Header', emoji: '🔝', required: true },
  { id: 'hero', label: 'Hero', emoji: '🎯', required: true },
  { id: 'about', label: 'About', emoji: 'ℹ️' },
  { id: 'services', label: 'Services', emoji: '⚙️' },
  { id: 'features', label: 'Features', emoji: '✨' },
  { id: 'portfolio', label: 'Portfolio', emoji: '🖼️' },
  { id: 'stats', label: 'Stats', emoji: '📊' },
  { id: 'testimonials', label: 'Reviews', emoji: '⭐' },
  { id: 'pricing', label: 'Pricing', emoji: '💰' },
  { id: 'faq', label: 'FAQ', emoji: '❓' },
  { id: 'contact', label: 'Contact', emoji: '📧' },
  { id: 'footer', label: 'Footer', emoji: '🔚', required: true },
];

// ── Assembler component that runs inside Craft.js Editor ──
function AssemblerInner({ contract, onAssembled }: { contract: InteractiveContract; onAssembled: (json: string) => void }) {
  const { query, actions } = useEditor();
  const assembled = useRef(false);

  useEffect(() => {
    if (assembled.current) return;
    assembled.current = true;

    // Small delay to let Craft.js initialize
    setTimeout(() => {
      try {
        const elements = buildElementsFromContract(contract);
        const ROOT_ID = 'ROOT';

        // Clear existing nodes
        const state = query.getState();
        const rootNode = state?.nodes?.[ROOT_ID];
        const childIds = (rootNode?.data?.nodes ?? []) as string[];
        [...childIds].reverse().forEach((id) => actions.delete(id));

        // Add new elements
        elements.forEach((element, index) => {
          const tree = query.parseReactElement(element).toNodeTree();
          actions.addNodeTree(tree, ROOT_ID, index);
        });

        // Serialize after a frame
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

// ── Preview component ──
function PreviewFrame({ craftJson, style }: { craftJson: string; style: string }) {
  const colorScheme = style === 'light' || style === 'minimal' ? 'light' : 'dark';
  const siteContextValue = {
    navigateToPage: () => {},
    toggleTheme: () => {},
    colorScheme,
  };

  return (
    <ThemeProvider initialAccent="#FF6B35" initialScheme={colorScheme}>
      <SiteContext.Provider value={siteContextValue}>
        <Editor resolver={resolver} enabled={false}>
          <Frame data={craftJson}>
            <Element is={Container} canvas />
          </Frame>
        </Editor>
      </SiteContext.Provider>
    </ThemeProvider>
  );
}

// ── Main component ──────────────────────────────────────
export default function InteractivePage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissedRotate, setDismissedRotate] = useState(false);

  const [contract, setContract] = useState<ContractState>({
    businessType: null,
    style: null,
    blocks: ['header', 'hero', 'footer'],
    companyName: '',
    step: 1,
  });

  // Preview state
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

  const totalSteps = 4;
  const progress = (contract.step / totalSteps) * 100;

  const canProceed = () => {
    switch (contract.step) {
      case 1: return !!contract.businessType;
      case 2: return !!contract.style;
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
      // Start assembling
      setAssembling(true);
    }
  };

  const handleBack = () => {
    if (showPreview) {
      setShowPreview(false);
      setCraftJson(null);
      return;
    }
    if (contract.step > 1) {
      setContract(prev => ({ ...prev, step: prev.step - 1 }));
    } else {
      router.push(`/${locale}`);
    }
  };

  const handleSaveProject = async () => {
    if (!craftJson) return;
    setSaving(true);

    const compressed = lz.compress(craftJson, { outputEncoding: 'Base64' });

    const projectData = {
      name: contract.companyName,
      description: `${contract.businessType} - ${contract.style}`,
      source: 'interactive' as const,
      data: {
        craft: {
          schemaVersion: 2,
          pages: [{
            id: 'page-1',
            name: 'Home',
            slug: 'home',
            data: null,
            desktopData: compressed,
            mobileData: null,
          }],
          activePageId: 'page-1',
        },
      },
    };

    if (isAuthenticated && user) {
      // Save to Supabase
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...projectData, user_id: user.id })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save:', error);
        alert('Failed to save project. Please try again.');
        setSaving(false);
        return;
      }

      router.push(`/${locale}/editor?id=${data.id}`);
    } else {
      // Save to localStorage for after registration
      localStorage.setItem('iam_interactive_contract', JSON.stringify({
        ...contract,
        craftJson: compressed,
        createdAt: new Date().toISOString(),
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

  // ── Portrait overlay ──
  if (isPortrait && !dismissedRotate) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #FF4500, #FF6B35)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>📱↻</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Rotate to Landscape</h2>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32, maxWidth: 300 }}>
          For the best experience, please rotate your device to landscape mode
        </p>
        <button
          onClick={() => setDismissedRotate(true)}
          style={{
            padding: '12px 32px', borderRadius: 100, border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Continue anyway
        </button>
      </div>
    );
  }

  // ── Assembling state: hidden Craft.js editor that builds the JSON ──
  if (assembling && !craftJson) {
    const interactiveContract: InteractiveContract = {
      businessType: contract.businessType!,
      style: contract.style!,
      blocks: contract.blocks,
      companyName: contract.companyName,
    };

    return (
      <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24, animation: 'spin 2s linear infinite' }}>🚀</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Building your website...</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Assembling {contract.blocks.length} sections</p>

        {/* Hidden Craft.js editor for assembly */}
        <div style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          <ThemeProvider initialAccent="#FF6B35" initialScheme={contract.style === 'light' ? 'light' : 'dark'}>
            <Editor resolver={resolver} enabled={true}>
              <AssemblerInner contract={interactiveContract} onAssembled={handleAssembled} />
              <Frame>
                <Element is={Container} canvas />
              </Frame>
            </Editor>
          </ThemeProvider>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Preview mode ──
  if (showPreview && craftJson) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        {/* Preview header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0, background: '#111',
        }}>
          <button onClick={handleBack} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
            fontSize: 14, cursor: 'pointer',
          }}>
            ← Back to edit
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#FF6B35' }}>
            Preview: {contract.companyName}
          </span>
          <button
            onClick={handleSaveProject}
            disabled={saving}
            style={{
              padding: '8px 24px', borderRadius: 100, border: 'none',
              background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #FF4500, #FF6B35)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : isAuthenticated ? '💾 Save & Edit' : '🔐 Sign up to save'}
          </button>
        </div>

        {/* Preview content — full screen scrollable */}
        <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <PreviewFrame craftJson={craftJson} style={contract.style || 'dark'} />
        </div>
      </div>
    );
  }

  // ── Wizard steps ──
  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0a', color: '#fff',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
      }}>
        <button onClick={handleBack} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← {contract.step === 1 ? 'Home' : 'Back'}
        </button>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Step {contract.step} of {totalSteps}
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #FF4500, #FF6B35)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', overflow: 'auto' }}>

        {contract.step === 1 && (
          <div style={{ width: '100%', maxWidth: 800, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>What&apos;s your business?</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Choose the category that best describes your project</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {BUSINESS_TYPES.map(bt => (
                <button key={bt.id} onClick={() => setContract(prev => ({ ...prev, businessType: bt.id }))}
                  style={{
                    padding: '16px 12px', borderRadius: 12,
                    border: contract.businessType === bt.id ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                    background: contract.businessType === bt.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
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

        {contract.step === 2 && (
          <div style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose a style</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>This sets the overall look and feel</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setContract(prev => ({ ...prev, style: s.id }))}
                  style={{
                    padding: '24px 16px', borderRadius: 12,
                    border: contract.style === s.id ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                    background: contract.style === s.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s ease', fontSize: 14, fontWeight: 600,
                  }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color, border: s.id === 'light' ? '1px solid rgba(255,255,255,0.2)' : 'none' }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {contract.step === 3 && (() => {
          // Optional blocks in user-selection order (excludes header/hero/footer)
          const optionalSelected = contract.blocks.filter(id => id !== 'header' && id !== 'hero' && id !== 'footer');
          return (
          <div style={{ width: '100%', maxWidth: 700, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose sections</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Header, Hero and Footer are always included</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {BLOCKS.map(b => {
                const isSelected = contract.blocks.includes(b.id);
                const isFooter = b.id === 'footer';
                const isHeaderOrHero = b.id === 'header' || b.id === 'hero';
                const positionIndex = !isFooter && !isHeaderOrHero ? optionalSelected.indexOf(b.id) : -1;
                const positionLabel = positionIndex !== -1 ? String(positionIndex + 1) : null;

                return (
                  <button key={b.id} onClick={() => toggleBlock(b.id)}
                    style={{
                      position: 'relative',
                      padding: '14px 10px', paddingTop: 22, borderRadius: 10,
                      border: isSelected ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                      color: b.required ? 'rgba(255,255,255,0.4)' : '#fff',
                      cursor: b.required ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s ease', fontSize: 13, fontWeight: 500,
                      opacity: b.required ? 0.6 : 1,
                    }}>
                    {/* Position badge — top-left corner */}
                    {positionLabel && (
                      <span style={{
                        position: 'absolute', top: 6, left: 8,
                        fontSize: 11, fontWeight: 800, color: '#FF6B35',
                        background: 'rgba(255,107,53,0.2)', borderRadius: 4,
                        padding: '1px 5px', lineHeight: 1.4,
                      }}>
                        {positionLabel}
                      </span>
                    )}
                    {/* Footer "last" badge */}
                    {isFooter && (
                      <span style={{
                        position: 'absolute', top: 6, left: 8,
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.06)', borderRadius: 4,
                        padding: '1px 5px', lineHeight: 1.4,
                      }}>
                        last
                      </span>
                    )}
                    <span style={{ fontSize: 22 }}>{b.emoji}</span>
                    {b.label}
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

        {contract.step === 4 && (
          <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Almost done!</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Enter your company or project name</p>
            <input type="text" value={contract.companyName}
              onChange={(e) => setContract(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="My Awesome Business" maxLength={50} autoFocus
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                color: '#fff', fontSize: 18, fontWeight: 600, textAlign: 'center', outline: 'none',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: 12, fontSize: 13 }}>
              {contract.companyName.length}/50 characters
            </p>
            <div style={{
              marginTop: 32, padding: 20, borderRadius: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'left', fontSize: 13,
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your website</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,107,53,0.15)', color: '#FF6B35', fontSize: 12 }}>
                  {BUSINESS_TYPES.find(b => b.id === contract.businessType)?.emoji} {BUSINESS_TYPES.find(b => b.id === contract.businessType)?.label}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {STYLES.find(s => s.id === contract.style)?.label} style
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {contract.blocks.length} sections
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'center', flexShrink: 0,
      }}>
        <button onClick={handleNext} disabled={!canProceed()}
          style={{
            padding: '14px 48px', borderRadius: 100, border: 'none',
            background: canProceed() ? 'linear-gradient(135deg, #FF4500, #FF6B35)' : 'rgba(255,255,255,0.08)',
            color: canProceed() ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 700,
            cursor: canProceed() ? 'pointer' : 'default',
            transition: 'all 0.2s ease', minWidth: 200,
          }}>
          {contract.step === totalSteps ? '🚀 Create Website' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
