'use client';

import { useState } from 'react';

const ORANGE = '#FF6B35';
const ORANGE_DARK = '#e55a25';
const ORANGE_LIGHT = 'rgba(255,107,53,0.06)';
const ORANGE_BORDER = 'rgba(255,107,53,0.2)';

const clientName = process.env.NEXT_PUBLIC_CLIENT_NAME || 'Your Business';

const steps = [
  { n: '01', icon: '💬', title: 'Open your AI', desc: 'Open Claude, ChatGPT, or Gemini — whichever you prefer. Connect to your MCP server.' },
  { n: '02', icon: '📋', title: 'Paste bootstrap prompt', desc: 'One prompt. AI reads your memory — goals, progress, context. Instantly knows where you left off.' },
  { n: '03', icon: '⚡', title: 'Work together', desc: 'Build, plan, decide. AI operates on your real project files — not just chatting.' },
  { n: '04', icon: '💾', title: 'Memory saves automatically', desc: 'AI updates your docs before the session ends. Next time, it picks up right here.' },
];

const devFeatures = [
  { icon: '🔗', title: 'MCP Protocol', desc: 'Industry standard. Claude, ChatGPT, and Gemini all connect to one server.' },
  { icon: '🛡️', title: 'Sandboxed tools', desc: 'AI can only touch project files. System configs, secrets, and RULES.md are locked.' },
  { icon: '🔄', title: 'Git snapshots', desc: 'Every change is committed. Full history, instant rollback.' },
  { icon: '🌐', title: 'Tunnel to anywhere', desc: 'One script connects Claude to your localhost or any VPS. No port forwarding.' },
];

const bizFeatures = [
  { icon: '🧠', title: 'Persistent memory', desc: 'AI remembers your business, goals, and progress across every session.' },
  { icon: '📊', title: 'Admin dashboard', desc: 'See your current goal, progress, and AI activity at a glance.' },
  { icon: '🤖', title: 'Works with any AI', desc: 'Not locked to one provider. Claude, ChatGPT, Gemini — your choice.' },
  { icon: '🔒', title: 'Your own server', desc: 'Fully isolated VPS. Your data stays on your machine, nowhere else.' },
];

const BOOTSTRAP = `You are my AI business operator. This system has persistent memory — read it before anything.

Read ALL files from memory/ directory using MCP:
- memory/RULES.md (FIRST — security rules, follow them strictly)
- memory/SYSTEM_IDENTITY.md
- memory/CURRENT_GOAL.md
- memory/NEXT_ACTIONS.md
- memory/WEEKLY_PROGRESS.md

After reading, in 3-5 sentences tell me:
1. Who I am and what this business is
2. What the current focus is
3. What my immediate next actions are

Then ask: "What do you want to work on today?"`;

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(BOOTSTRAP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 40px',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: ORANGE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>I AM RUNNING</span>
        </div>
        <a href="/admin" style={{
          background: ORANGE, color: '#fff', padding: '7px 16px', borderRadius: 8,
          fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>Admin Panel →</a>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px 60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: ORANGE_LIGHT, border: `1px solid ${ORANGE_BORDER}`,
          borderRadius: 20, padding: '5px 14px',
          fontSize: 11, fontWeight: 700, color: ORANGE,
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, display: 'inline-block' }} />
          AI Native Business OS
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5.5vw, 56px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 20, color: '#0a0a0a',
        }}>
          Your AI business operator<br />
          <span style={{ color: ORANGE }}>is ready to work.</span>
        </h1>

        <p style={{ fontSize: 17, color: '#666', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 36px' }}>
          Welcome, <strong style={{ color: '#333' }}>{clientName}</strong>. This system keeps your goals,
          context, and progress — so every AI session starts from where you left off.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/admin" style={{
            background: ORANGE, color: '#fff', padding: '13px 28px', borderRadius: 10,
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(255,107,53,0.25)',
          }}>Enter Admin Panel →</a>
          <button onClick={copy} style={{
            background: copied ? '#22c55e' : '#f5f5f5', color: copied ? '#fff' : '#333',
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{copied ? '✓ Copied!' : '📋 Copy Bootstrap Prompt'}</button>
        </div>
      </section>

      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '64px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>How it works</h2>
          <p style={{ color: '#888', fontSize: 15 }}>Four steps. Every session. Any AI.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {steps.map(({ n, icon, title, desc }) => (
            <div key={n} style={{
              background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 14,
              padding: '24px 20px', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = ORANGE_BORDER)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#f0f0f0')}
            >
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.08em', marginBottom: 8 }}>{n}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111' }}>{title}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* FOR DEVELOPERS */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '64px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-block', background: '#f0fdf4', color: '#16a34a', borderRadius: 20,
            padding: '4px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>For Developers & Startups</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
            Connect AI to your codebase
          </h2>
          <p style={{ color: '#888', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
            One MCP server. Claude, ChatGPT, and Gemini all see your project. Persistent memory across sessions.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {devFeatures.map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 14, padding: '24px 20px',
            }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111' }}>{title}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* FOR BUSINESS */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '64px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-block', background: '#fef3c7', color: '#d97706', borderRadius: 20,
            padding: '4px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>For Business</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
            AI that remembers your business
          </h2>
          <p style={{ color: '#888', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
            Stop explaining your context every time. AI reads your goals, progress, and decisions — then gets to work.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {bizFeatures.map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 14, padding: '24px 20px',
            }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111' }}>{title}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* BOOTSTRAP PROMPT */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 40px' }}>
        <div style={{
          background: '#fffbf8', border: `1.5px solid ${ORANGE_BORDER}`,
          borderRadius: 16, padding: '32px 36px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Quick Start</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Paste this into Claude at the start of every session</div>
            </div>
            <button onClick={copy} style={{
              background: copied ? '#22c55e' : ORANGE, color: '#fff', border: 'none',
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{copied ? '✓ Copied!' : 'Copy prompt'}</button>
          </div>
          <div style={{
            background: '#fff', border: '1px solid #efefef', borderRadius: 10,
            padding: '18px 22px', fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12.5, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap',
          }}>{BOOTSTRAP}</div>
        </div>
      </section>

      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* SECURITY */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 12 }}>🔒</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Security first</h3>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
          Your data lives on your own isolated server. MCP tools are sandboxed — AI cannot access system files.
          RULES.md is locked and tamper-protected. Only connect <strong style={{ color: '#555' }}>your own MCP server</strong> in Claude settings.
        </p>
      </section>

      <div style={{ borderTop: '1px solid #f0f0f0' }} />

      {/* FOOTER */}
      <footer style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontSize: 12, color: '#999' }}>
            Powered by <strong style={{ color: '#555' }}>I AM RUNNING</strong>
          </span>
        </div>
        <a href="https://iamrunning.online" style={{ fontSize: 12, color: ORANGE, textDecoration: 'none', fontWeight: 600 }}>iamrunning.online →</a>
      </footer>
    </div>
  );
}
