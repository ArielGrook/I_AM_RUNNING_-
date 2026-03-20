'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

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
  { id: 'services', label: 'Services', emoji: '⚙️', disabled: true, disabledReason: 'Coming soon' },
  { id: 'features', label: 'Features', emoji: '✨' },
  { id: 'portfolio', label: 'Portfolio', emoji: '🖼️' },
  { id: 'stats', label: 'Stats', emoji: '📊' },
  { id: 'testimonials', label: 'Reviews', emoji: '⭐' },
  { id: 'pricing', label: 'Pricing', emoji: '💰' },
  { id: 'faq', label: 'FAQ', emoji: '❓' },
  { id: 'contact', label: 'Contact', emoji: '📧' },
  { id: 'footer', label: 'Footer', emoji: '🔚', required: true },
];

// ── Preview Component ──────────────────────────────
function SitePreview({ craftJson, onClose, onEdit }: { craftJson: string; onClose: () => void; onEdit: () => void }) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Store craftJson in sessionStorage for preview page to read
  useEffect(() => {
    if (craftJson) {
      sessionStorage.setItem('iam_preview_craft_json', craftJson);
    }
  }, [craftJson]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: '#111', borderBottom: '1px solid #222',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#999', fontSize: 14,
            cursor: 'pointer', padding: '6px 12px',
          }}
        >
          ← Back
        </button>
        <span style={{ color: '#666', fontSize: 13 }}>Preview</span>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #FF4500, #FF6B35)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ✏️ Edit in Editor
        </button>
      </div>

      {/* Preview iframe */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          src="/api/preview"
          style={{
            width: '100%', height: '100%', border: 'none',
          }}
        />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────
export default function InteractivePage() {
  const router = useRouter();
  const locale = useLocale();
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissedRotate, setDismissedRotate] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [previewData, setPreviewData] = useState<{ craftJson: string; projectId: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contract, setContract] = useState<ContractState>({
    businessType: null,
    style: null,
    blocks: ['header', 'hero', 'footer'],
    companyName: '',
    step: 1,
  });

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

  const handleAssemble = async () => {
    setAssembling(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: contract.businessType,
          style: contract.style,
          blocks: contract.blocks,
          companyName: contract.companyName,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.projectId) {
        // Authenticated — go to editor
        router.push(`/${locale}/editor?id=${data.projectId}`);
      } else {
        // Anonymous — show preview
        setPreviewData({ craftJson: data.craftJson, projectId: null });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assemble');
    } finally {
      setAssembling(false);
    }
  };

  const handleNext = () => {
    if (contract.step < totalSteps) {
      setContract(prev => ({ ...prev, step: prev.step + 1 }));
    } else {
      handleAssemble();
    }
  };

  const handleBack = () => {
    if (contract.step > 1) {
      setContract(prev => ({ ...prev, step: prev.step - 1 }));
    } else {
      router.push(`/${locale}`);
    }
  };

  const toggleBlock = (id: string) => {
    const block = BLOCKS.find(b => b.id === id);
    if (block?.required || block?.disabled) return;
    setContract(prev => ({
      ...prev,
      blocks: prev.blocks.includes(id)
        ? prev.blocks.filter(b => b !== id)
        : [...prev.blocks, id],
    }));
  };

  // Preview mode
  if (previewData) {
    return (
      <SitePreview
        craftJson={previewData.craftJson}
        onClose={() => setPreviewData(null)}
        onEdit={() => {
          // Save contract and redirect to auth
          localStorage.setItem('iam_interactive_contract', JSON.stringify({
            businessType: contract.businessType,
            style: contract.style,
            blocks: contract.blocks,
            companyName: contract.companyName,
          }));
          router.push(`/${locale}/auth/signup?redirect=/${locale}/dashboard`);
        }}
      />
    );
  }

  // Portrait overlay
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
          For the best experience, please rotate your device
        </p>
        <button
          onClick={() => setDismissedRotate(true)}
          style={{
            padding: '12px 32px', borderRadius: 100, border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Continue anyway
        </button>
      </div>
    );
  }

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
          fontSize: 14, cursor: 'pointer',
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

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', overflow: 'auto' }}>

        {/* Step 1: Business Type */}
        {contract.step === 1 && (
          <div style={{ width: '100%', maxWidth: 800, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>What&apos;s your business?</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Choose the category that best describes your project</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {BUSINESS_TYPES.map(bt => (
                <button key={bt.id} onClick={() => setContract(prev => ({ ...prev, businessType: bt.id }))}
                  style={{
                    padding: '16px 12px', borderRadius: 12, cursor: 'pointer',
                    border: contract.businessType === bt.id ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                    background: contract.businessType === bt.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.15s ease', fontSize: 13, fontWeight: 500,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{bt.emoji}</span>
                  {bt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Style */}
        {contract.step === 2 && (
          <div style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose a style</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>This sets the overall look and feel</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setContract(prev => ({ ...prev, style: s.id }))}
                  style={{
                    padding: '24px 16px', borderRadius: 12, cursor: 'pointer',
                    border: contract.style === s.id ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                    background: contract.style === s.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s ease', fontSize: 14, fontWeight: 600,
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color, border: s.id === 'light' ? '1px solid rgba(255,255,255,0.2)' : 'none' }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Blocks */}
        {contract.step === 3 && (
          <div style={{ width: '100%', maxWidth: 700, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose sections</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Header, Hero and Footer are always included</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {BLOCKS.map(b => {
                const isSelected = contract.blocks.includes(b.id);
                const isDisabled = b.required || b.disabled;
                return (
                  <button key={b.id} onClick={() => toggleBlock(b.id)}
                    style={{
                      padding: '14px 10px', borderRadius: 10, cursor: isDisabled ? 'default' : 'pointer',
                      border: isSelected ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                      color: isDisabled ? 'rgba(255,255,255,0.3)' : '#fff',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s ease', fontSize: 13, fontWeight: 500,
                      opacity: b.disabled ? 0.4 : b.required ? 0.6 : 1,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{b.emoji}</span>
                    {b.label}
                    {b.required && <span style={{ fontSize: 10, color: '#FF6B35' }}>required</span>}
                    {b.disabled && <span style={{ fontSize: 10, color: '#666' }}>{b.disabledReason}</span>}
                  </button>
                );
              })}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: 16, fontSize: 13 }}>
              {contract.blocks.length} sections selected
            </p>
          </div>
        )}

        {/* Step 4: Company Name */}
        {contract.step === 4 && (
          <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Almost done!</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Enter your company or project name</p>
            <input
              type="text" value={contract.companyName}
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
        <button
          onClick={handleNext}
          disabled={!canProceed() || assembling}
          style={{
            padding: '14px 48px', borderRadius: 100, border: 'none',
            background: canProceed() && !assembling ? 'linear-gradient(135deg, #FF4500, #FF6B35)' : 'rgba(255,255,255,0.08)',
            color: canProceed() && !assembling ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 700,
            cursor: canProceed() && !assembling ? 'pointer' : 'default',
            transition: 'all 0.2s ease', minWidth: 200,
          }}
        >
          {assembling ? '⏳ Building...' : contract.step === totalSteps ? '🚀 Create Website' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
