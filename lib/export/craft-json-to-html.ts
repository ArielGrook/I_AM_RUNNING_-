import { CraftJson, ExportResult } from './types';

// Базовые стили которые всегда включаются в экспорт
const BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; }
img { max-width: 100%; height: auto; }
`;

// Рендер одного нода в HTML строку
function renderNode(nodeId: string, nodes: CraftJson): string {
  const node = nodes[nodeId];
  if (!node) return '';

  const { resolvedName } = node.type;
  const props = node.props;
  const children = (node.nodes || []).map((id) => renderNode(id, nodes)).join('\n');

  switch (resolvedName) {
    case 'Container':
      return `<div style="position:relative">${children}</div>`;

    case 'Text':
      return `<p style="${propsToInlineStyle(props as Record<string, string>)}">${String(props.text ?? '')}</p>`;

    case 'Button':
      return `<a href="${String(props.href ?? '#')}" style="${propsToInlineStyle(props as Record<string, string>)}">${String(props.text ?? 'Button')}</a>`;

    case 'Image':
      return `<img src="${String(props.src ?? '')}" alt="${String(props.alt ?? '')}" style="${propsToInlineStyle(props as Record<string, string>)}" />`;

    case 'Divider':
      return '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;" />';

    case 'HtmlBlock':
      return `<div>${String(props.html ?? '')}</div>`;

    // Tron компоненты — заглушки которые будут заменены в следующем шаге
    case 'HeaderTron':
    case 'HeroTron':
    case 'TronFeatures':
    case 'TronStats':
    case 'TronPortfolio':
    case 'TronTestimonials':
    case 'TronPricing':
    case 'TronFAQ':
    case 'TronShowcase':
    case 'TronContact':
    case 'TronFooter':
      return renderTronSection(resolvedName, props as Record<string, unknown>, children);

    // Дочерние ноды Tron — пропускаем, рендерятся внутри родителя
    case 'HeroTronHeading':
    case 'HeroTronSubheading':
    case 'HeroTronButton':
    case 'FeatureCard':
    case 'StatItem':
    case 'TestimonialCard':
    case 'PricingCard':
    case 'FAQItem':
    case 'FooterColumn':
    case 'SectionBlock':
    case 'LayoutBlock':
    case 'CardBlock':
    case 'PricingCardBlock':
      return '';

    default:
      return children;
  }
}

// ─── ИКОНКИ (SVG inline для экспорта) ───────────────────────────────────────
const ICONS: Record<string, string> = {
  email: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  location: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  twitter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  github: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>',
  linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  bullet: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>',
};

// ─── УТИЛИТЫ ─────────────────────────────────────────────────────────────────
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

function sectionWrap(content: string, props: Record<string, unknown>, name: string): string {
  const colorScheme = String(props.colorScheme ?? 'dark');
  const bg = colorScheme === 'dark' ? String(props.darkBg ?? '#0a0a0a') : String(props.lightBg ?? '#ffffff');
  const minH = `${String(props.sectionHeight ?? 80)}vh`;
  const accent = String(props.accentColor ?? '#FF6B35');
  return `<section id="${name.toLowerCase().replace('tron', '').replace('hero', 'hero')}" style="background:${bg};min-height:${minH};position:relative;" data-accent="${accent}" data-scheme="${colorScheme}">
  <div style="position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:80px 24px;">
    ${content}
  </div>
</section>`;
}

function sectionHeader(title: unknown, subtitle: unknown, textColor: string, secondaryColor: string): string {
  let out = '';
  if (title) out += `<h2 style="color:${textColor};font-size:clamp(28px,4vw,48px);font-weight:700;text-align:center;margin-bottom:16px;line-height:1.2;">${esc(title)}</h2>`;
  if (subtitle) out += `<p style="color:${secondaryColor};font-size:18px;text-align:center;margin-bottom:56px;">${esc(subtitle)}</p>`;
  return out;
}

function getColors(props: Record<string, unknown>) {
  const dark = String(props.colorScheme ?? 'dark') === 'dark';
  return {
    text: dark ? '#ffffff' : '#0a0a0a',
    secondary: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    cardBg: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    accent: String(props.accentColor ?? '#FF6B35'),
  };
}

// ─── RENDERERS ───────────────────────────────────────────────────────────────
function renderHeaderTron(props: Record<string, unknown>): string {
  const dark = String(props.colorScheme ?? 'dark') === 'dark';
  const bg = dark ? String(props.darkBg ?? '#0a0a0a') : String(props.lightBg ?? '#ffffff');
  const text = dark ? '#ffffff' : '#0a0a0a';
  const secondary = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const accent = String(props.accentColor ?? '#FF6B35');
  const sticky = props.sticky !== false ? 'position:sticky;top:0;z-index:50;' : '';
  const navLinks = (props.navLinks ?? []) as Array<{ label: string; href: string }>;
  const navHtml = navLinks
    .map(
      (l) =>
        `<a href="${esc(l.href)}" style="color:${secondary};text-decoration:none;font-size:14px;font-weight:500;transition:color 0.2s;" onmouseover="this.style.color='${accent}'" onmouseout="this.style.color='${secondary}'">${esc(l.label)}</a>`
    )
    .join('');

  return `<header style="background:${bg};border-bottom:1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};${sticky}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;">
    <div style="color:${text};font-size:18px;font-weight:700;letter-spacing:0.05em;">${esc(props.logoText ?? 'BRAND')}</div>
    <nav style="display:flex;gap:32px;align-items:center;">${navHtml}</nav>
    ${props.showCta !== false ? `<a href="${esc(props.ctaHref ?? '#')}" style="background:${accent};color:#fff;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">${esc(props.ctaText ?? 'Get started')}</a>` : ''}
  </div>
</header>`;
}

function renderHeroTron(props: Record<string, unknown>): string {
  const c = getColors(props);
  const dark = String(props.colorScheme ?? 'dark') === 'dark';
  const bg = dark ? String(props.darkBg ?? '#0a0a0a') : String(props.lightBg ?? '#ffffff');
  const minH = `${String(props.sectionHeight ?? 85)}vh`;

  return `<section style="background:${bg};min-height:${minH};display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;">
  <div style="max-width:800px;">
    ${props.showBadge !== false && props.badge ? `<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:999px;background:rgba(${hexToRgb(c.accent)},0.1);border:1px solid rgba(${hexToRgb(c.accent)},0.2);color:${c.accent};font-size:13px;font-weight:500;margin-bottom:32px;">${esc(props.badge)}</div>` : ''}
    <h1 style="color:${c.text};font-size:clamp(40px,6vw,80px);font-weight:800;line-height:1.1;margin-bottom:16px;letter-spacing:-0.02em;">${esc(props.headline ?? '')}</h1>
    ${props.subheadline ? `<h2 style="color:${c.accent};font-size:clamp(20px,3vw,32px);font-weight:600;margin-bottom:24px;">${esc(props.subheadline)}</h2>` : ''}
    ${props.subtitle ? `<p style="color:${c.secondary};font-size:18px;line-height:1.7;margin-bottom:40px;max-width:600px;margin-left:auto;margin-right:auto;">${esc(props.subtitle)}</p>` : ''}
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
      <a href="#" style="background:${c.accent};color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600;">${esc(props.primaryCta ?? 'Get started')}</a>
      ${props.showSecondaryCta !== false && props.secondaryCta ? `<a href="#" style="border:1px solid ${c.border};color:${c.text};padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:500;">${esc(props.secondaryCta)}</a>` : ''}
    </div>
    ${props.showSocialProof && props.socialProofText ? `<p style="color:${c.secondary};font-size:14px;margin-top:32px;">${esc(props.socialProofText)}</p>` : ''}
  </div>
</section>`;
}

function renderTronStats(props: Record<string, unknown>): string {
  const c = getColors(props);
  const items = (props.items ?? []) as Array<{ value: string; label: string; prefix?: string; suffix?: string }>;
  const cols = Number(props.columns ?? 4);
  const itemsHtml = items
    .map(
      (item) =>
        `<div style="text-align:center;padding:32px 16px;">
      <div style="color:${c.accent};font-size:clamp(36px,5vw,56px);font-weight:800;line-height:1;">${esc(item.prefix ?? '')}${esc(item.value)}${esc(item.suffix ?? '')}</div>
      <div style="color:${c.secondary};font-size:15px;margin-top:8px;font-weight:500;">${esc(item.label)}</div>
    </div>`
    )
    .join('');

  return sectionWrap(`<div style="display:grid;grid-template-columns:repeat(${Math.min(cols, items.length || cols)},1fr);gap:0;">${itemsHtml}</div>`, props, 'stats');
}

function renderTronFeatures(props: Record<string, unknown>): string {
  const c = getColors(props);
  const items = (props.items ?? []) as Array<{ iconKey?: string; title: string; description: string }>;
  const cols = Number(props.columns ?? 3);
  const cardStyle = String(props.cardStyle ?? 'filled');

  const cardCss =
    cardStyle === 'filled'
      ? `background:${c.cardBg};border:1px solid ${c.border};border-radius:16px;padding:32px;`
      : cardStyle === 'bordered'
        ? `border:1px solid ${c.border};border-radius:16px;padding:32px;`
        : 'padding:32px 16px;';

  const itemsHtml = items
    .map(
      (item) =>
        `<div style="${cardCss}">
      <div style="color:${c.accent};margin-bottom:16px;">${ICONS[item.iconKey ?? ''] ?? ICONS.bullet}</div>
      <h3 style="color:${c.text};font-size:18px;font-weight:700;margin-bottom:12px;">${esc(item.title)}</h3>
      <p style="color:${c.secondary};font-size:15px;line-height:1.6;">${esc(item.description)}</p>
    </div>`
    )
    .join('');

  const header = sectionHeader(props.title, props.subtitle, c.text, c.secondary);
  return sectionWrap(`${header}<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:24px;">${itemsHtml}</div>`, props, 'features');
}

function renderTronPortfolio(props: Record<string, unknown>): string {
  const c = getColors(props);
  const items = (props.items ?? []) as Array<{ imageUrl?: string; title: string; description?: string; category?: string }>;
  const itemsHtml = items
    .map((item) => {
      const imgSrc = item.imageUrl ? `assets/${item.imageUrl.split('/').pop()?.split('?')[0]}` : '';
      return `<div style="background:${c.cardBg};border:1px solid ${c.border};border-radius:16px;overflow:hidden;">
      ${imgSrc ? `<img src="${esc(imgSrc)}" alt="${esc(item.title)}" style="width:100%;height:240px;object-fit:cover;" />` : `<div style="width:100%;height:240px;background:${c.border};"></div>`}
      <div style="padding:24px;">
        ${item.category ? `<div style="color:${c.accent};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">${esc(item.category)}</div>` : ''}
        <h3 style="color:${c.text};font-size:18px;font-weight:700;margin-bottom:8px;">${esc(item.title)}</h3>
        ${item.description ? `<p style="color:${c.secondary};font-size:14px;line-height:1.5;">${esc(item.description)}</p>` : ''}
      </div>
    </div>`;
    })
    .join('');

  const header = sectionHeader(props.title, props.subtitle, c.text, c.secondary);
  return sectionWrap(`${header}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">${itemsHtml}</div>`, props, 'portfolio');
}

function renderTronTestimonials(props: Record<string, unknown>): string {
  const c = getColors(props);
  const items = (props.items ?? []) as Array<{ quote: string; author: string; role?: string; company?: string; avatarUrl?: string; avatarBase64?: string }>;
  const itemsHtml = items
    .map((item) => {
      const avatar = item.avatarUrl ? `assets/${item.avatarUrl.split('/').pop()?.split('?')[0]}` : (item.avatarBase64 ?? '');
      return `<div style="background:${c.cardBg};border:1px solid ${c.border};border-radius:16px;padding:32px;flex:0 0 320px;">
      <p style="color:${c.text};font-size:16px;line-height:1.7;margin-bottom:24px;font-style:italic;">"${esc(item.quote)}"</p>
      <div style="display:flex;align-items:center;gap:12px;">
        ${avatar ? `<img src="${esc(avatar)}" alt="${esc(item.author)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />` : `<div style="width:40px;height:40px;border-radius:50%;background:${c.accent};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">${esc(item.author.charAt(0))}</div>`}
        <div>
          <div style="color:${c.text};font-weight:600;font-size:14px;">${esc(item.author)}</div>
          <div style="color:${c.secondary};font-size:13px;">${esc(item.role ?? '')}${item.company ? ` · ${esc(item.company)}` : ''}</div>
        </div>
      </div>
    </div>`;
    })
    .join('');

  const header = sectionHeader(props.title, props.subtitle, c.text, c.secondary);
  return sectionWrap(`${header}<div style="display:flex;gap:24px;overflow-x:auto;padding-bottom:16px;">${itemsHtml}</div>`, props, 'testimonials');
}

function renderTronPricing(props: Record<string, unknown>): string {
  const c = getColors(props);
  const plans = (props.plans ?? []) as Array<{
    name: string;
    price: string;
    period?: string;
    subtitle?: string;
    isPopular?: boolean;
    isHighlighted?: boolean;
    ctaText?: string;
    features?: Array<{ text: string; included: boolean }>;
  }>;

  const plansHtml = plans
    .map((plan) => {
      const highlighted = plan.isPopular || plan.isHighlighted;
      const cardStyle = highlighted ? `background:${c.accent};border:2px solid ${c.accent};` : `background:${c.cardBg};border:1px solid ${c.border};`;
      const textColor = highlighted ? '#fff' : c.text;
      const secColor = highlighted ? 'rgba(255,255,255,0.7)' : c.secondary;

      const featuresHtml = (plan.features ?? [])
        .map(
          (f) =>
            `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="color:${f.included ? (highlighted ? '#fff' : c.accent) : secColor};flex-shrink:0;">${f.included ? ICONS.check : ICONS.x}</span>
        <span style="color:${f.included ? textColor : secColor};font-size:14px;">${esc(f.text)}</span>
      </div>`
        )
        .join('');

      return `<div style="${cardStyle}border-radius:16px;padding:32px;position:relative;">
      ${plan.isPopular ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#fff;color:${c.accent};font-size:12px;font-weight:700;padding:4px 16px;border-radius:999px;white-space:nowrap;">Most Popular</div>` : ''}
      <h3 style="color:${textColor};font-size:18px;font-weight:700;margin-bottom:4px;">${esc(plan.name)}</h3>
      ${plan.subtitle ? `<p style="color:${secColor};font-size:14px;margin-bottom:20px;">${esc(plan.subtitle)}</p>` : '<div style="margin-bottom:20px;"></div>'}
      <div style="margin-bottom:24px;">
        <span style="color:${textColor};font-size:clamp(36px,4vw,48px);font-weight:800;">${esc(plan.price)}</span>
        <span style="color:${secColor};font-size:16px;">${esc(plan.period ?? '/mo')}</span>
      </div>
      <div style="margin-bottom:28px;">${featuresHtml}</div>
      <a href="#" style="display:block;text-align:center;padding:12px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;${highlighted ? `background:#fff;color:${c.accent};` : `background:${c.accent};color:#fff;`}">${esc(plan.ctaText ?? 'Get started')}</a>
    </div>`;
    })
    .join('');

  const header = sectionHeader(props.title, props.subtitle, c.text, c.secondary);
  return sectionWrap(`${header}<div style="display:grid;grid-template-columns:repeat(${plans.length},1fr);gap:24px;align-items:start;">${plansHtml}</div>`, props, 'pricing');
}

function renderTronFAQ(props: Record<string, unknown>): string {
  const c = getColors(props);
  const items = (props.items ?? []) as Array<{ question: string; answer: string }>;
  const itemsHtml = items
    .map(
      (item, i) =>
        `<details style="background:${c.cardBg};border:1px solid ${c.border};border-radius:12px;padding:0;margin-bottom:12px;overflow:hidden;" ${i === 0 ? 'open' : ''}>
      <summary style="color:${c.text};font-size:16px;font-weight:600;padding:20px 24px;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">
        ${esc(item.question)}
        <span style="color:${c.accent};font-size:20px;flex-shrink:0;margin-left:16px;">+</span>
      </summary>
      <div style="color:${c.secondary};font-size:15px;line-height:1.7;padding:0 24px 20px;">
        ${esc(item.answer)}
      </div>
    </details>`
    )
    .join('');

  const header = sectionHeader(props.title, props.subtitle, c.text, c.secondary);
  const ctaHtml =
    props.showCta && props.ctaText
      ? `<div style="text-align:center;margin-top:48px;"><a href="#contact" style="background:${c.accent};color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;">${esc(props.ctaText)}</a></div>`
      : '';
  return sectionWrap(`${header}<div style="max-width:720px;margin:0 auto;">${itemsHtml}</div>${ctaHtml}`, props, 'faq');
}

function renderTronShowcase(props: Record<string, unknown>): string {
  const c = getColors(props);
  const items = (props.items ?? []) as Array<{
    label: string;
    title?: string;
    body?: string;
    bullets?: Array<{ text: string }>;
    videoUrl?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaShow?: boolean;
  }>;

  const itemsHtml = items
    .map((item, i) => {
      const mediaSrc = item.imageUrl
        ? `<img src="assets/${esc(item.imageUrl.split('/').pop()?.split('?')[0] ?? '')}" style="width:100%;border-radius:12px;max-height:360px;object-fit:cover;" />`
        : item.videoUrl
          ? `<video controls style="width:100%;border-radius:12px;max-height:360px;"><source src="assets/${esc(item.videoUrl.split('/').pop()?.split('?')[0] ?? '')}"/></video>`
          : `<div style="width:100%;height:280px;background:${c.cardBg};border:1px solid ${c.border};border-radius:12px;display:flex;align-items:center;justify-content:center;color:${c.secondary};">Media</div>`;

      const bulletsHtml = (item.bullets ?? [])
        .map(
          (b) =>
            `<li style="display:flex;align-items:center;gap:8px;margin-bottom:10px;color:${c.secondary};font-size:15px;"><span style="color:${c.accent};">${ICONS.bullet}</span>${esc(b.text)}</li>`
        )
        .join('');

      return `<div id="showcase-tab-${i}" style="${i === 0 ? '' : 'display:none;'}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
        <div>
          ${item.title ? `<h3 style="color:${c.text};font-size:24px;font-weight:700;margin-bottom:16px;">${esc(item.title)}</h3>` : ''}
          ${item.body ? `<p style="color:${c.secondary};font-size:16px;line-height:1.7;margin-bottom:24px;">${esc(item.body)}</p>` : ''}
          ${bulletsHtml ? `<ul style="list-style:none;padding:0;margin-bottom:24px;">${bulletsHtml}</ul>` : ''}
          ${item.ctaShow && item.ctaText ? `<a href="#" style="background:${c.accent};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">${esc(item.ctaText)}</a>` : ''}
        </div>
        <div>${mediaSrc}</div>
      </div>
    </div>`;
    })
    .join('');

  const tabsHtml = items
    .map(
      (item, i) =>
        `<button onclick="showTab(${i})" id="tab-btn-${i}" style="padding:10px 20px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:500;background:${i === 0 ? `rgba(${hexToRgb(c.accent)},0.15)` : c.cardBg};color:${i === 0 ? c.accent : c.secondary};">${esc(item.label)}</button>`
    )
    .join('');

  const tabScript = `<script>
function showTab(n){
  document.querySelectorAll('[id^="showcase-tab-"]').forEach((el,i)=>el.style.display=i===n?'':'none');
  document.querySelectorAll('[id^="tab-btn-"]').forEach((btn,i)=>{
    btn.style.background=i===n?'rgba(${hexToRgb(c.accent)},0.15)':'${c.cardBg}';
    btn.style.color=i===n?'${c.accent}':'${c.secondary}';
  });
}
</script>`;

  const header = sectionHeader(props.title, props.subtitle, c.text, c.secondary);
  return sectionWrap(`${header}<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:40px;">${tabsHtml}</div>${itemsHtml}${tabScript}`, props, 'showcase');
}

function renderTronContact(props: Record<string, unknown>): string {
  const c = getColors(props);
  const contactInfo = (props.contactInfo ?? []) as Array<{ iconKey: string; label: string; value: string }>;

  const infoHtml = contactInfo
    .map(
      (info) =>
        `<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:24px;">
      <div style="color:${c.accent};flex-shrink:0;width:40px;height:40px;background:rgba(${hexToRgb(c.accent)},0.1);border-radius:10px;display:flex;align-items:center;justify-content:center;">${ICONS[info.iconKey] ?? ''}</div>
      <div>
        <div style="color:${c.secondary};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">${esc(info.label)}</div>
        <div style="color:${c.text};font-size:16px;">${esc(info.value)}</div>
      </div>
    </div>`
    )
    .join('');

  const inputStyle = `width:100%;padding:12px 16px;border-radius:10px;border:1px solid ${c.border};background:${c.cardBg};color:${c.text};font-size:15px;box-sizing:border-box;margin-bottom:16px;outline:none;`;
  const header = sectionHeader(props.title, props.subtitle, c.text, c.secondary);

  return sectionWrap(
    `${header}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;">
    <div>${infoHtml}</div>
    <form onsubmit="return false;" style="display:flex;flex-direction:column;">
      <input placeholder="${esc(props.namePlaceholder ?? 'Your name')}" style="${inputStyle}" />
      <input placeholder="${esc(props.emailPlaceholder ?? 'your@email.com')}" style="${inputStyle}" />
      <textarea rows="5" placeholder="${esc(props.messagePlaceholder ?? 'Your message...')}" style="${inputStyle}resize:vertical;"></textarea>
      <button type="submit" style="background:${c.accent};color:#fff;padding:14px;border-radius:10px;border:none;font-size:16px;font-weight:600;cursor:pointer;">${esc(props.submitText ?? 'Send message')}</button>
    </form>
  </div>`,
    props,
    'contact'
  );
}

function renderTronFooter(props: Record<string, unknown>): string {
  const dark = String(props.colorScheme ?? 'dark') === 'dark';
  const bg = dark ? String(props.darkBg ?? '#0a0a0a') : String(props.lightBg ?? '#ffffff');
  const text = dark ? '#ffffff' : '#0a0a0a';
  const secondary = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const accent = String(props.accentColor ?? '#FF6B35');
  const columns = (props.columns ?? []) as Array<{ title: string; links: Array<{ label: string; href: string }>; description?: string }>;
  const socialLinks = (props.socialLinks ?? []) as Array<{ platform: string; href: string }>;

  const colsHtml = columns
    .map(
      (col) =>
        `<div>
      <h4 style="color:${text};font-size:14px;font-weight:700;margin-bottom:16px;letter-spacing:0.05em;">${esc(col.title)}</h4>
      ${col.description ? `<p style="color:${secondary};font-size:14px;line-height:1.6;margin-bottom:16px;">${esc(col.description)}</p>` : ''}
      ${col.links.map((l) => `<a href="${esc(l.href)}" style="display:block;color:${secondary};text-decoration:none;font-size:14px;margin-bottom:10px;">${esc(l.label)}</a>`).join('')}
    </div>`
    )
    .join('');

  const socialsHtml =
    props.showSocials !== false
      ? socialLinks
          .map(
            (s) =>
              `<a href="${esc(s.href)}" style="color:${secondary};width:36px;height:36px;border:1px solid ${border};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">${ICONS[s.platform] ?? s.platform}</a>`
          )
          .join('')
      : '';

  return `<footer style="background:${bg};border-top:1px solid ${border};padding:64px 24px 32px;">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:2fr repeat(${columns.length - 1},1fr);gap:48px;margin-bottom:48px;">
      ${colsHtml}
    </div>
    <div style="border-top:1px solid ${border};padding-top:32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
      <p style="color:${secondary};font-size:13px;">${esc(props.copyright ?? `© ${new Date().getFullYear()} ${esc(props.brandName ?? 'Company')}. All rights reserved.`)}</p>
      <div style="display:flex;gap:12px;">${socialsHtml}</div>
    </div>
  </div>
</footer>`;
}

// ─── ГЛАВНЫЙ SWITCH (заменяет renderTronSection) ────────────────────────────
function renderTronSection(name: string, props: Record<string, unknown>, _children: string): string {
  switch (name) {
    case 'HeaderTron':
      return renderHeaderTron(props);
    case 'HeroTron':
      return renderHeroTron(props);
    case 'TronStats':
      return renderTronStats(props);
    case 'TronFeatures':
      return renderTronFeatures(props);
    case 'TronPortfolio':
      return renderTronPortfolio(props);
    case 'TronTestimonials':
      return renderTronTestimonials(props);
    case 'TronPricing':
      return renderTronPricing(props);
    case 'TronFAQ':
      return renderTronFAQ(props);
    case 'TronShowcase':
      return renderTronShowcase(props);
    case 'TronContact':
      return renderTronContact(props);
    case 'TronFooter':
      return renderTronFooter(props);
    default:
      return `<section data-component="${name}" style="min-height:40vh;"></section>`;
  }
}

// Конвертация props в inline style строку
function propsToInlineStyle(props: Record<string, string>): string {
  const styleProps: Record<string, string> = {};
  if (props.color) styleProps.color = props.color;
  if (props.fontSize) styleProps.fontSize = `${String(props.fontSize)}px`;
  if (props.textAlign) styleProps.textAlign = props.textAlign;
  if (props.fontWeight) styleProps.fontWeight = props.fontWeight;
  if (props.margin) styleProps.margin = props.margin;
  if (props.padding) styleProps.padding = props.padding;
  return Object.entries(styleProps).map(([k, v]) => `${k}:${v}`).join(';');
}

// Собираем все media URL из всех нодов (для скачивания в assets/)
export function extractMediaUrls(nodes: CraftJson): Array<{ filename: string; url: string }> {
  const assets: Array<{ filename: string; url: string }> = [];

  Object.values(nodes).forEach((node) => {
    const props = node.props as Record<string, unknown>;
    // Поля которые могут содержать Supabase Storage URL
    const mediaFields = ['imageUrl', 'videoUrl', 'backgroundImage', 'src', 'logoSrc'];
    mediaFields.forEach((field) => {
      const val = props[field];
      if (typeof val === 'string' && val.startsWith('http') && val.includes('supabase')) {
        const filename = val.split('/').pop()?.split('?')[0] ?? `asset-${Date.now()}`;
        // Избегаем дублей
        if (!assets.find((a) => a.url === val)) {
          assets.push({ filename, url: val });
        }
      }
    });

    // items массив (TronPortfolio, TronTestimonials и др.)
    if (Array.isArray(props.items)) {
      (props.items as Array<Record<string, unknown>>).forEach((item, i) => {
        ['imageUrl', 'videoUrl', 'imageBase64'].forEach((field) => {
          const val = item[field];
          if (typeof val === 'string' && val.startsWith('http') && val.includes('supabase')) {
            const filename = `item-${i}-${val.split('/').pop()?.split('?')[0] ?? Date.now()}`;
            if (!assets.find((a) => a.url === val)) {
              assets.push({ filename, url: val });
            }
          }
        });
      });
    }
  });

  return assets;
}

// Главная функция — Craft.js JSON → ExportResult
export function craftJsonToHtml(craftJsonString: string): ExportResult {
  const nodes: CraftJson = JSON.parse(craftJsonString) as CraftJson;

  // Обходим от ROOT
  const rootNode = nodes.ROOT;
  if (!rootNode) throw new Error('No ROOT node found in Craft.js JSON');

  const bodyContent = (rootNode.nodes || []).map((id) => renderNode(id, nodes)).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Site</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${bodyContent}
</body>
</html>`;

  const assets = extractMediaUrls(nodes);

  return { html, css: BASE_CSS, assets };
}
