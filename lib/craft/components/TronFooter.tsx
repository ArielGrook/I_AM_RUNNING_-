'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from './TronStats';

// ── Tokens (darkBg/lightBg from props, like TronContact) ─────────────────
function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      border: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
    },
  };
}

// ── Social SVG Icons ─────────────────────────────────────────────────────
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  github: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  linkedin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
};

// ── Interfaces ───────────────────────────────────────────────────────────
export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'instagram';
  href: string;
}

export interface TronFooterProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  brandName?: string;
  brandDescription?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  copyright?: string;
  showSocials?: boolean;
  animationType?: string;
  animateDelay?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'Changelog', href: '#' }] },
  { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Careers', href: '#' }] },
  { title: 'Legal', links: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }, { label: 'Cookies', href: '#' }] },
];

// ── Main component ────────────────────────────────────────────────────────
export const TronFooter = React.memo(function TronFooter() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect?.width ?? 0) < 768);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const props = useNode((node) => node.data.props as Partial<TronFooterProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    brandName = 'Company',
    brandDescription = 'Building the future of web development, one component at a time.',
    columns = DEFAULT_COLUMNS,
    socialLinks = [
      { platform: 'twitter' as const, href: '#' },
      { platform: 'github' as const, href: '#' },
      { platform: 'linkedin' as const, href: '#' },
    ],
    copyright = '© 2026 Company. All rights reserved.',
    showSocials = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const cols = Array.isArray(columns) ? columns : DEFAULT_COLUMNS;
  const socials = Array.isArray(socialLinks) ? socialLinks : [];

  const sectionRef = React.useRef<HTMLElement | null>(null);

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      data-block-type="footer"
      className={`w-full max-w-full py-12 px-4 sm:px-6 lg:px-16 ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        borderTop: `1px solid ${t.border}`,
      }}
    >
      <div className="max-w-6xl mx-auto w-full" {...animAttrs}>
        {/* Row 1 — main content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr',
            gap: isMobile ? 32 : 48,
            paddingBottom: 48,
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          {/* Brand column */}
          <div style={{ width: '100%' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                background: t.accent,
                color: t.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              {brandName ? brandName.charAt(0).toUpperCase() : 'C'}
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: t.text,
                margin: '0 0 8px',
              }}
            >
              {enabled ? (
                <EditableText value={brandName ?? ''} fieldKey="brandName" tag="span" style={{ color: t.text, fontWeight: 600 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.brandName = val; }, 0)} />
              ) : (
                brandName
              )}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: t.textSecondary,
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 280,
              }}
            >
              {enabled ? (
                <EditableText value={brandDescription ?? ''} fieldKey="brandDescription" tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.brandDescription = val; }, 0)} />
              ) : (
                brandDescription
              )}
            </p>
            {showSocials && socials.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 20,
                }}
              >
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: t.textSecondary,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = t.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = t.textSecondary;
                    }}
                  >
                    {SOCIAL_ICONS[s.platform] ?? null}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {isMobile ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
              }}
            >
              {cols.map((col, i) => (
                <div key={i}>
                  <h4
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: t.textSecondary,
                      margin: '0 0 12px',
                    }}
                  >
                    {enabled ? (
                      <EditableText value={col.title ?? ''} fieldKey={`footer-col-${i}-title`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                        const cols = [...((p.columns as FooterColumn[]) ?? [])];
                        cols[i] = { ...cols[i], title: val };
                        p.columns = cols;
                      }, 0)} />
                    ) : (
                      col.title
                    )}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(col.links ?? []).map((link, j) => (
                      <li key={j} style={{ marginBottom: 8 }}>
                        <a
                          href={link.href}
                          style={{
                            fontSize: 14,
                            color: t.text,
                            textDecoration: 'none',
                          }}
                        >
                          {enabled ? (
                            <EditableText value={link.label ?? ''} fieldKey={`footer-col-${i}-link-${j}`} tag="span" style={{ color: t.text }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                              const cols = [...((p.columns as FooterColumn[]) ?? [])];
                              const links = [...(cols[i]?.links ?? [])];
                              links[j] = { ...links[j], label: val };
                              cols[i] = { ...cols[i], links };
                              p.columns = cols;
                            }, 0)} />
                          ) : (
                            link.label
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            cols.map((col, i) => (
              <div key={i}>
                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: t.textSecondary,
                    margin: '0 0 12px',
                  }}
                >
                  {enabled ? (
                    <EditableText value={col.title ?? ''} fieldKey={`footer-col-${i}-title`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                      const cols = [...((p.columns as FooterColumn[]) ?? [])];
                      cols[i] = { ...cols[i], title: val };
                      p.columns = cols;
                    }, 0)} />
                  ) : (
                    col.title
                  )}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(col.links ?? []).map((link, j) => (
                    <li key={j} style={{ marginBottom: 8 }}>
                      <a
                        href={link.href}
                        style={{
                          fontSize: 14,
                          color: t.text,
                          textDecoration: 'none',
                        }}
                      >
                        {enabled ? (
                          <EditableText value={link.label ?? ''} fieldKey={`footer-col-${i}-link-${j}`} tag="span" style={{ color: t.text }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                            const cols = [...((p.columns as FooterColumn[]) ?? [])];
                            const links = [...(cols[i]?.links ?? [])];
                            links[j] = { ...links[j], label: val };
                            cols[i] = { ...cols[i], links };
                            p.columns = cols;
                          }, 0)} />
                        ) : (
                          link.label
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Row 2 — copyright */}
        <div
          style={{
            paddingTop: 24,
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: t.textSecondary,
              margin: 0,
            }}
          >
            {enabled ? (
              <EditableText value={copyright ?? ''} fieldKey="copyright" tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.copyright = val; }, 0)} />
            ) : (
              copyright
            )}
          </p>
        </div>
      </div>
    </section>
  );
});

// ── Settings ───────────────────────────────────────────────────────────────
function TronFooterSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronFooterProps>) ?? {};
  const {
    brandName = 'Company',
    brandDescription = 'Building the future of web development, one component at a time.',
    columns = DEFAULT_COLUMNS,
    socialLinks = [
      { platform: 'twitter' as const, href: '#' },
      { platform: 'github' as const, href: '#' },
      { platform: 'linkedin' as const, href: '#' },
    ],
    copyright = '© 2026 Company. All rights reserved.',
    showSocials = true,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const cols = Array.isArray(columns) ? columns : DEFAULT_COLUMNS;
  const socials = Array.isArray(socialLinks) ? socialLinks : [];

  const setT = (key: keyof TronFooterProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const updateColumn = (colIndex: number, field: keyof FooterColumn, value: unknown) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.columns as FooterColumn[] ?? [])];
      arr[colIndex] = { ...arr[colIndex], [field]: value };
      p.columns = arr;
    }, 500);
  };

  const updateLink = (colIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.columns as FooterColumn[] ?? [])];
      const links = [...(arr[colIndex]?.links ?? [])];
      links[linkIndex] = { ...links[linkIndex], [field]: value };
      arr[colIndex] = { ...arr[colIndex], links };
      p.columns = arr;
    }, 500);
  };

  const addLink = (colIndex: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.columns as FooterColumn[] ?? [])];
      const links = [...(arr[colIndex]?.links ?? []), { label: 'Link', href: '#' }];
      arr[colIndex] = { ...arr[colIndex], links };
      p.columns = arr;
    }, 0);
  };

  const removeLink = (colIndex: number, linkIndex: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.columns as FooterColumn[] ?? [])];
      const links = (arr[colIndex]?.links ?? []).filter((_, i) => i !== linkIndex);
      arr[colIndex] = { ...arr[colIndex], links };
      p.columns = arr;
    }, 0);
  };

  const addColumn = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.columns as FooterColumn[] ?? []), { title: 'New', links: [{ label: 'Link', href: '#' }] }];
      p.columns = arr;
    }, 0);
  };

  const removeColumn = (colIndex: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = (p.columns as FooterColumn[] ?? []).filter((_, i) => i !== colIndex);
      p.columns = arr;
    }, 0);
  };

  const updateSocial = (index: number, field: keyof SocialLink, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.socialLinks as SocialLink[] ?? [])];
      arr[index] = { ...arr[index], [field]: value };
      p.socialLinks = arr;
    }, 500);
  };

  const addSocial = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.socialLinks as SocialLink[] ?? []), { platform: 'twitter' as const, href: '#' }];
      p.socialLinks = arr;
    }, 0);
  };

  const removeSocial = (index: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = (p.socialLinks as SocialLink[] ?? []).filter((_, i) => i !== index);
      p.socialLinks = arr;
    }, 0);
  };

  return (
    <div className="p-3 space-y-0">
      {/* BRAND */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Brand</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Brand name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setT('brandName', 500)(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Brand description</label>
            <input
              type="text"
              value={brandDescription}
              onChange={(e) => setT('brandDescription', 500)(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* COLUMNS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Columns</h3>
        <div className="space-y-4">
          {cols.map((col, colIndex) => (
            <div
              key={colIndex}
              style={{
                background: 'var(--settings-card-bg, rgba(0,0,0,0.03))',
                border: '1px solid var(--settings-border, rgba(0,0,0,0.08))',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
              className="space-y-2"
            >
              <div>
                <label className={labelCls}>Column title</label>
                <input
                  type="text"
                  value={col.title}
                  onChange={(e) => updateColumn(colIndex, 'title', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Links</label>
                {(col.links ?? []).map((link, linkIndex) => (
                  <div key={linkIndex} className="flex gap-2 items-center mb-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(colIndex, linkIndex, 'label', e.target.value)}
                      className={inputCls}
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => updateLink(colIndex, linkIndex, 'href', e.target.value)}
                      className={inputCls}
                      placeholder="URL"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(colIndex, linkIndex)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addLink(colIndex)}
                  className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]"
                >
                  + Add link
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeColumn(colIndex)}
                className="text-xs text-red-400 hover:underline"
              >
                Remove column
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addColumn}
            className="px-2 py-1.5 text-xs rounded bg-gray-600 text-white hover:bg-gray-500"
          >
            + Add column
          </button>
        </div>
      </div>

      {/* SOCIALS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Socials</h3>
        <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <input
            type="checkbox"
            checked={showSocials}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.showSocials = e.target.checked; })}
            className="rounded border-gray-600 bg-gray-700"
          />
          Show social links
        </label>
        <div className="space-y-2">
          {socials.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={s.platform}
                onChange={(e) => updateSocial(i, 'platform', e.target.value)}
                className={inputCls}
                style={{ width: 100 }}
              >
                <option value="twitter">Twitter</option>
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
              </select>
              <input
                type="text"
                value={s.href}
                onChange={(e) => updateSocial(i, 'href', e.target.value)}
                className={inputCls}
                placeholder="URL"
              />
              <button
                type="button"
                onClick={() => removeSocial(i)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocial}
            className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]"
          >
            + Add social
          </button>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Copyright</h3>
        <div>
          <label className={labelCls}>Copyright text</label>
          <input
            type="text"
            value={copyright}
            onChange={(e) => setT('copyright', 500)(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={darkBg ?? '#0a0a0a'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={lightBg ?? '#ffffff'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </div>

      {/* ANIMATION */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Type</label>
            <select
              value={animationType}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
              className={inputCls}
            >
              <option value="none">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-down">Slide Down</option>
              <option value="slide-left">Slide Left</option>
              <option value="slide-right">Slide Right</option>
              <option value="scale-in">Scale In</option>
              <option value="blur-in">Blur In</option>
              <option value="rotate-in">Rotate In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select
              value={animateDelay}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })}
              className={inputCls}
            >
              {['0', '0.1', '0.2', '0.3', '0.5', '0.8', '1'].map((v) => (
                <option key={v} value={v}>{v}s</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────
const tronFooterCraft = {
  displayName: 'Tron Footer',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    brandName: 'Company',
    brandDescription: 'Building the future of web development, one component at a time.',
    showSocials: true,
    socialLinks: [
      { platform: 'twitter' as const, href: '#' },
      { platform: 'github' as const, href: '#' },
      { platform: 'linkedin' as const, href: '#' },
    ],
    columns: DEFAULT_COLUMNS,
    copyright: '© 2026 Company. All rights reserved.',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronFooterSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['footer'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronFooter as unknown as { craft: typeof tronFooterCraft }).craft = tronFooterCraft;

// ── FooterColumn: backward compatibility for resolver ─────────────────────
export interface FooterColumnProps {
  title: string;
  links: FooterLink[];
  description?: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const FooterColumn = React.memo(function FooterColumn(props: FooterColumnProps) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { title, links, description, accentColor = '#FF6B35', colorScheme = 'dark' } = props;
  const tokens = buildTokens('#0a0a0a', '#ffffff');
  const t = { ...tokens[colorScheme], accent: accentColor };
  const isBrand = description != null && description !== '';
  const firstLetter = (title || 'B').charAt(0).toUpperCase();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={isSelected ? 'craft-node-selected' : ''}
      style={{ padding: 8 }}
    >
      {isBrand ? (
        <>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              background: accentColor,
              color: t.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {firstLetter}
          </div>
          <p style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.6, margin: 0, maxWidth: 280 }}>{description}</p>
        </>
      ) : (
        <>
          <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: accentColor, margin: '0 0 12px' }}>{title || 'Links'}</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(links ?? []).map((link, j) => (
              <li key={j} style={{ marginBottom: 8 }}>
                <a href={link.href} style={{ fontSize: 14, color: t.text, textDecoration: 'none' }}>{link.label}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
});

function FooterColumnSettings() {
  const { actions: { setProp } } = useNode();
  const { title, links, description, animationType, animateDelay } = useNode((n) => n.data.props as FooterColumnProps) ?? {} as FooterColumnProps;
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const linkList = links ?? [];

  const updateLink = (index: number, field: 'label' | 'href', value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.links as FooterLink[])];
      arr[index] = { ...arr[index], [field]: value };
      p.links = arr;
    }, 500);
  };

  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} placeholder="Column title" /></div>
      <div><label className={labelCls}>Description (optional, for brand column)</label><textarea value={description ?? ''} onChange={(e) => setT('description', 500)(e.target.value)} className={inputCls} rows={2} placeholder="Leave empty for link column" /></div>
      <div><label className={labelCls}>Links</label></div>
      {linkList.map((link, j) => (
        <div key={j} className="flex gap-2 items-center">
          <input value={link.label} onChange={(e) => updateLink(j, 'label', e.target.value)} className={inputCls} placeholder="Label" />
          <input value={link.href} onChange={(e) => updateLink(j, 'href', e.target.value)} className={inputCls} placeholder="URL" />
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.links = (p.links as FooterLink[]).filter((_, k) => k !== j); }, 500)} className="text-xs text-red-400 shrink-0">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.links = [...(p.links as FooterLink[] || []), { label: 'Link', href: '#' }]; }, 500)} className="text-xs text-gray-400">+ Add link</button>
      <div><label className={labelCls}>Animation</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
}

(FooterColumn as unknown as { craft: object }).craft = {
  displayName: 'Footer Column',
  props: { title: 'Links', links: [{ label: 'Link', href: '#' }], accentColor: '#FF6B35', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: FooterColumnSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
