'use client';

import { useState } from 'react';

const ORANGE = '#FF6B35';
const ORANGE_DARK = '#e55a25';
const ORANGE_LIGHT = 'rgba(255,107,53,0.08)';
const ORANGE_BORDER = 'rgba(255,107,53,0.2)';

const steps = [
  { n: '01', title: 'Open Claude', desc: 'Go to claude.ai. Make sure the I AM RUNNING connector is enabled in your settings.' },
  { n: '02', title: 'Paste bootstrap prompt', desc: 'Find it below. Copy and paste it at the start of every new session.' },
  { n: '03', title: 'AI reads your context', desc: 'Claude reads your goals, progress, and current state — knows exactly where you left off.' },
  { n: '04', title: 'Work. Save. Repeat.', desc: 'Build, plan, decide. Ask AI to update your docs before ending. Next session continues here.' },
];

const BOOTSTRAP = `You are my AI business operator.

Please read these files using the MCP connector:
1. context-core/SYSTEM_IDENTITY.md
2. context-core/CURRENT_GOAL.md  
3. context-core/NEXT_ACTIONS.md
4. context-core/WEEKLY_PROGRESS.md

Summarize my current situation in 3–5 sentences, then ask what I want to work on today.`;

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(BOOTSTRAP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 40px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: ORANGE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
            I AM RUNNING
          </span>
        </div>
        <a
          href="/admin"
          style={{
            background: ORANGE, color: '#fff',
            padding: '8px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = ORANGE_DARK)}
          onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}
        >
          Admin Panel →
        </a>
      </nav>

      {/* HERO */}
      <section style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '100px 40px 80px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: ORANGE_LIGHT,
          border: `1px solid ${ORANGE_BORDER}`,
          borderRadius: 20, padding: '5px 14px',
          fontSize: 12, fontWeight: 600, color: ORANGE,
          marginBottom: 32, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, display: 'inline-block' }} />
          AI Native Business Operating System
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          marginBottom: 24,
          color: '#0a0a0a',
        }}>
          Your AI business operator<br />
          <span style={{ color: ORANGE }}>is ready to work.</span>
        </h1>

        <p style={{
          fontSize: 18, color: '#666', lineHeight: 1.7,
          maxWidth: 520, margin: '0 auto 40px',
        }}>
          This system keeps your goals, context, and progress — so every AI session
          starts from where you left off. No more repeating yourself.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/admin" style={{
            background: ORANGE, color: '#fff',
            padding: '14px 32px', borderRadius: 10,
            fontSize: 15, fontWeight: 700,
            textDecoration: 'none', letterSpacing: '-0.01em',
            boxShadow: '0 4px 20px rgba(255,107,53,0.3)',
          }}>
            Enter Admin Panel →
          </a>
          <a href="#how" style={{
            background: '#f5f5f5', color: '#333',
            padding: '14px 32px', borderRadius: 10,
            fontSize: 15, fontWeight: 600,
            textDecoration: 'none',
          }}>
            How it works
          </a>
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 960, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            How to use this system
          </h2>
          <p style={{ color: '#777', fontSize: 16 }}>Four steps. Every session.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {steps.map(({ n, title, desc }) => (
            <div key={n} style={{
              background: '#fafafa',
              border: '1px solid #efefef',
              borderRadius: 16, padding: '28px 24px',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = ORANGE_BORDER)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#efefef')}
            >
              <div style={{
                fontSize: 11, fontWeight: 800, color: ORANGE,
                letterSpacing: '0.1em', marginBottom: 14,
              }}>{n}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: '#111' }}>{title}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BOOTSTRAP PROMPT */}
      <section style={{ maxWidth: 760, margin: '0 auto 80px', padding: '0 40px' }}>
        <div style={{
          background: '#fffbf9',
          border: `1.5px solid ${ORANGE_BORDER}`,
          borderRadius: 16, padding: '36px 40px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20, flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Quick Start Prompt
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                Paste this into Claude at the start of every session
              </div>
            </div>
            <button
              onClick={copy}
              style={{
                background: copied ? '#22c55e' : ORANGE,
                color: '#fff', border: 'none',
                padding: '9px 20px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy prompt'}
            </button>
          </div>

          <div style={{
            background: '#fff',
            border: '1px solid #efefef',
            borderRadius: 10, padding: '20px 24px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 13, color: '#444', lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}>
            {BOOTSTRAP}
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: '#aaa' }}>
            Full bootstrap prompts are in your Admin Panel → bootstrap-prompts/
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* FOOTER */}
      <footer style={{
        padding: '28px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: ORANGE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>
            Powered by <strong style={{ color: '#555' }}>I AM RUNNING</strong> · AI Native Business OS
          </span>
        </div>
        <span style={{ fontSize: 13, color: '#ccc' }}>
          Want your own system? <a href="https://iamrunning.online" style={{ color: ORANGE, textDecoration: 'none', fontWeight: 600 }}>iamrunning.online</a>
        </span>
      </footer>

    </div>
  );
}
