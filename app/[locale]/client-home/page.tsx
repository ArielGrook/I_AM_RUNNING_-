'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Client onboarding landing — shown when CLIENT_SLUG is set in env
// This replaces the main I AM RUNNING marketing landing for client instances

export default function ClientLanding() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const clientName = process.env.NEXT_PUBLIC_CLIENT_NAME || 'Your Business';
  const clientSlug = process.env.NEXT_PUBLIC_CLIENT_SLUG || '';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: "'Inter', -apple-system, sans-serif",
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
    }}>

      {/* Header */}
      <header style={{
        padding: '24px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>AI</div>
          <span style={{ fontSize: 15, fontWeight: 600, opacity: 0.9 }}>
            {clientName}
          </span>
        </div>
        <button
          onClick={() => router.push(`/${locale}/admin`)}
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#a5b4fc',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Enter Admin Panel →
        </button>
      </header>

      {/* Hero */}
      <section style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '100px 40px 80px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: 12,
          color: '#a5b4fc',
          marginBottom: 28,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          AI Native Business Operating System
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 800,
          margin: '0 0 20px',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}>
          Your AI operator is<br />
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            ready to work
          </span>
        </h1>

        <p style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.7,
          margin: '0 0 48px',
          maxWidth: 520,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          This is your personal AI-powered business operating system.
          Connect Claude or ChatGPT, and your AI will know your context,
          goals, and history — every session.
        </p>

        <button
          onClick={() => router.push(`/${locale}/admin`)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            color: '#fff',
            padding: '16px 36px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 0 40px rgba(99,102,241,0.3)',
          }}
        >
          Enter Admin Panel →
        </button>
      </section>

      {/* How it works */}
      <section style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 40px 80px',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 48,
          color: 'rgba(255,255,255,0.85)',
        }}>
          How to use this system
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              step: '01',
              title: 'Open Claude or ChatGPT',
              desc: 'Use any AI you prefer. Make sure the I AM RUNNING connector is enabled in settings.',
            },
            {
              step: '02',
              title: 'Paste the bootstrap prompt',
              desc: 'Find it in your Admin Panel → bootstrap-prompts folder. Copy and paste it at the start of every session.',
            },
            {
              step: '03',
              title: 'AI reads your context',
              desc: 'The AI reads your goals, progress, and project state. It knows exactly where you left off.',
            },
            {
              step: '04',
              title: 'Work and save',
              desc: 'Build, plan, decide. At the end of the session, ask AI to update your docs. Context persists.',
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#6366f1',
                letterSpacing: '0.1em',
                marginBottom: 14,
              }}>{step}</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bootstrap prompt hint */}
      <section style={{
        maxWidth: 760,
        margin: '0 auto 80px',
        padding: '0 40px',
      }}>
        <div style={{
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          padding: '32px 36px',
        }}>
          <div style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 600, marginBottom: 12 }}>
            QUICK START — Paste this in Claude or ChatGPT
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.8,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 10,
            padding: '16px 20px',
          }}>
            You are my AI business operator. Read these files:<br />
            1. context-core/SYSTEM_IDENTITY.md<br />
            2. context-core/CURRENT_GOAL.md<br />
            3. context-core/NEXT_ACTIONS.md<br />
            <br />
            Summarize my current situation and wait for my input.
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Full bootstrap prompts are in your Admin Panel → bootstrap-prompts/
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px',
        textAlign: 'center',
        fontSize: 13,
        color: 'rgba(255,255,255,0.2)',
      }}>
        Powered by I AM RUNNING · AI Native Business Operating System
      </footer>
    </div>
  );
}
