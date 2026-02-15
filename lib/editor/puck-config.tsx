/**
 * Puck editor component config.
 * Phase 1: Basic blocks. Phase 3: F03 premium components (Hero01, Header01, etc.) with fields → Tailwind.
 * Custom fields: Gradient, Animation, Background Image, Typography (see components/editor).
 */

'use client';

import React from 'react';
import { GradientBuilder } from '@/components/editor/GradientBuilder';
import { AnimationControls, type AnimationValue } from '@/components/editor/AnimationControls';
import { BackgroundImageField, type BackgroundImageValue } from '@/components/editor/BackgroundImageField';
import { TypographyField, type TypographyValue } from '@/components/editor/TypographyField';

const accentOptions = [
  { label: 'Orange', value: 'orange' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Green', value: 'green' },
];

const accentClasses: Record<string, string> = {
  orange: 'bg-[#FF6B35] hover:bg-[#ff8555] text-white shadow-orange-500/25',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25',
  green: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25',
};

const accentTextClasses: Record<string, string> = {
  orange: 'text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-orange-300',
  blue: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400',
  purple: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400',
  green: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400',
};

export const puckConfig = {
  components: {
    HeadingBlock: {
      fields: {
        children: { type: 'text', label: 'Heading' },
        level: {
          type: 'select',
          label: 'Level',
          options: [
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
          ],
        },
      },
      defaultProps: { children: 'Heading', level: 'h1' },
      render: ({ children, level }: { children?: string; level?: string }) => {
        const Tag = ((level as 'h1' | 'h2' | 'h3') || 'h1') as keyof JSX.IntrinsicElements;
        return (
          <Tag className="text-3xl font-bold text-gray-900 dark:text-white">
            {children}
          </Tag>
        );
      },
    },
    TextBlock: {
      fields: {
        text: { type: 'textarea', label: 'Content' },
      },
      defaultProps: { text: 'Add your text here.' },
      render: ({ text }: { text?: string }) => (
        <p className="text-base text-gray-700 dark:text-gray-300">{text}</p>
      ),
    },
    HeroBlock: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'text', label: 'Subtitle' },
      },
      defaultProps: { title: 'Welcome', subtitle: 'Build something great.' },
      render: ({ title, subtitle }: { title?: string; subtitle?: string }) => (
        <section className="bg-[#FF6B35]/10 dark:bg-[#FF6B35]/20 rounded-lg p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>
        </section>
      ),
    },
    // Custom fields demo: gradient section
    GradientSection: {
      fields: {
        backgroundGradient: {
          type: 'custom',
          label: 'Background gradient',
          render: ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => (
            <GradientBuilder value={value} onChange={onChange} />
          ),
        },
        title: { type: 'text', label: 'Title' },
      },
      defaultProps: {
        backgroundGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
        title: 'Gradient section',
      },
      render: (props: Record<string, unknown>) => (
        <section
          className="rounded-lg p-8 text-center min-h-[120px] flex items-center justify-center"
          style={{ background: (props.backgroundGradient as string) || undefined }}
        >
          <h2 className="text-2xl font-bold text-white drop-shadow-md">{props.title as string}</h2>
        </section>
      ),
    },
    // Custom fields demo: animated block (data-animate attributes)
    AnimatedBlock: {
      fields: {
        animation: {
          type: 'custom',
          label: 'Animation',
          render: ({
            value,
            onChange,
          }: {
            value?: AnimationValue | null;
            onChange: (v: AnimationValue) => void;
          }) => <AnimationControls value={value} onChange={onChange} />,
        },
        children: { type: 'text', label: 'Content' },
      },
      defaultProps: {
        animation: { type: 'fade-up', delay: 0, duration: 500 },
        children: 'Animated content',
      },
      render: (props: Record<string, unknown>) => {
        const anim = (props.animation as AnimationValue) || {};
        const attrs: Record<string, string | number> = {};
        if (anim.type) attrs['data-animate'] = anim.type;
        if (anim.delay != null) attrs['data-animate-delay'] = String(anim.delay);
        if (anim.duration != null) attrs['data-animate-duration'] = String(anim.duration);
        return (
          <div
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900"
            {...attrs}
          >
            {props.children as string}
          </div>
        );
      },
    },
    // Custom fields demo: background image section
    ImageBackgroundSection: {
      fields: {
        backgroundImage: {
          type: 'custom',
          label: 'Background image',
          render: ({
            value,
            onChange,
          }: {
            value?: BackgroundImageValue | null;
            onChange: (v: BackgroundImageValue) => void;
          }) => <BackgroundImageField value={value} onChange={onChange} />,
        },
        title: { type: 'text', label: 'Title' },
      },
      defaultProps: {
        backgroundImage: { url: '', opacity: 100, backgroundSize: 'cover', backgroundPosition: 'center' },
        title: 'Image background',
      },
      render: (props: Record<string, unknown>) => {
        const bg = (props.backgroundImage as BackgroundImageValue) || {};
        const style: React.CSSProperties = {
          opacity: (bg.opacity ?? 100) / 100,
          backgroundSize: bg.backgroundSize ?? 'cover',
          backgroundPosition: bg.backgroundPosition ?? 'center',
        };
        if (bg.url) style.backgroundImage = `url(${bg.url})`;
        return (
          <section
            className="rounded-lg p-8 text-center min-h-[160px] flex items-center justify-center bg-gray-200 dark:bg-gray-800 bg-no-repeat"
            style={style}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-md">
              {props.title as string}
            </h2>
          </section>
        );
      },
    },
    // Custom fields demo: typography (grouped in one field)
    StyledHeading: {
      fields: {
        title: { type: 'text', label: 'Title' },
        typography: {
          type: 'custom',
          label: 'Typography',
          render: ({
            value,
            onChange,
          }: {
            value?: TypographyValue | null;
            onChange: (v: TypographyValue) => void;
          }) => <TypographyField value={value} onChange={onChange} />,
        },
      },
      defaultProps: {
        title: 'Styled heading',
        typography: {
          fontSize: 24,
          fontWeight: '700',
          lineHeight: 1.3,
          letterSpacing: 0,
          color: '#000000',
          textAlign: 'left',
        },
      },
      render: (props: Record<string, unknown>) => {
        const ty = (props.typography as TypographyValue) || {};
        const style: React.CSSProperties = {
          fontSize: ty.fontSize != null ? `${ty.fontSize}px` : undefined,
          fontWeight: ty.fontWeight,
          lineHeight: ty.lineHeight,
          letterSpacing: ty.letterSpacing != null ? `${ty.letterSpacing}px` : undefined,
          color: ty.color,
          textAlign: ty.textAlign,
        };
        return (
          <h2 className="m-0" style={style}>
            {props.title as string}
          </h2>
        );
      },
    },
    // F03: Hero01 – Gradient hero with CTAs
    Hero01: {
      fields: {
        badge: { type: 'text', label: 'Badge' },
        title: { type: 'text', label: 'Title' },
        titleAccent: { type: 'text', label: 'Title accent (gradient)' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        primaryCta: { type: 'text', label: 'Primary CTA' },
        secondaryCta: { type: 'text', label: 'Secondary CTA' },
        accent: {
          type: 'select',
          label: 'Accent',
          options: accentOptions,
        },
      },
      defaultProps: {
        badge: 'Now available — Start building today',
        title: 'Build Stunning Websites',
        titleAccent: 'Without Writing Code',
        subtitle: 'The modern website builder that combines premium design with drag-and-drop simplicity.',
        primaryCta: 'Get Started Free',
        secondaryCta: 'Watch Demo',
        accent: 'orange',
      },
      render: (props: Record<string, unknown>) => {
        const accent = (props.accent as string) || 'orange';
        const btnClass = `inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${accentClasses[accent] || accentClasses.orange}`;
        return (
          <section className="relative overflow-hidden min-h-[80vh] flex items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-gray-300 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
                {props.badge as string}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
                {props.title as string}
                <br />
                <span className={accentTextClasses[accent] || accentTextClasses.orange}>
                  {props.titleAccent as string}
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10">{props.subtitle as string}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#" className={btnClass}>{props.primaryCta as string}</a>
                <a href="#" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl transition-all">
                  {props.secondaryCta as string}
                </a>
              </div>
            </div>
          </section>
        );
      },
    },
    // F03: Hero02 – Split layout
    Hero02: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        ctaText: { type: 'text', label: 'CTA button' },
        accent: { type: 'select', label: 'Accent', options: accentOptions },
      },
      defaultProps: {
        title: 'The Future of Web Design',
        subtitle: 'Create stunning websites in minutes with our AI-powered design system.',
        ctaText: 'Start Building',
        accent: 'orange',
      },
      render: (props: Record<string, unknown>) => {
        const accent = (props.accent as string) || 'orange';
        return (
          <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                  {props.title as string}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{props.subtitle as string}</p>
                <a
                  href="#"
                  className={`inline-flex px-8 py-4 text-lg font-semibold rounded-full text-white shadow-lg transition-all ${accentClasses[accent] || accentClasses.orange}`}
                >
                  {props.ctaText as string}
                </a>
              </div>
              <div className="h-96 bg-gradient-to-br from-[#FF6B35]/20 to-orange-400/20 dark:from-[#FF6B35]/30 dark:to-orange-400/30 rounded-2xl" />
            </div>
          </section>
        );
      },
    },
    // F03: Header01 – Glass header
    Header01: {
      fields: {
        logoText: { type: 'text', label: 'Logo' },
        navItems: { type: 'text', label: 'Nav (comma-separated)' },
        ctaText: { type: 'text', label: 'CTA button' },
      },
      defaultProps: {
        logoText: 'Brand',
        navItems: 'Home, Features, Pricing, About, Contact',
        ctaText: 'Get Started',
      },
      render: (props: Record<string, unknown>) => {
        const items = ((props.navItems as string) || '').split(',').map((s) => s.trim()).filter(Boolean);
        return (
          <header className="sticky top-0 z-50 w-full">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-18">
                  <a href="#" className="flex items-center gap-2.5 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{props.logoText as string}</span>
                  </a>
                  <nav className="hidden md:flex items-center gap-1">
                    {items.map((label) => (
                      <a key={label} href="#" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        {label}
                      </a>
                    ))}
                  </nav>
                  <a href="#" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#e65a2a] rounded-lg transition-all shadow-sm">
                    {props.ctaText as string}
                  </a>
                </div>
              </div>
            </div>
          </header>
        );
      },
    },
    // Phase 4: Raw HTML from ZIP import
    ImportedHTML: {
      fields: {
        html: {
          type: 'textarea',
          label: 'HTML',
        },
      },
      defaultProps: {
        html: '',
      },
      render: (props: Record<string, unknown>) => {
        const html = (props.html as string) || '';
        if (!html.trim()) {
          return (
            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400">
              Imported HTML (empty)
            </div>
          );
        }
        return (
          <div
            className="imported-html-wrapper w-full overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      },
    },
    // F03: CTA01 – Call to action strip
    CTA01: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'text', label: 'Subtitle' },
        buttonText: { type: 'text', label: 'Button' },
        accent: { type: 'select', label: 'Accent', options: accentOptions },
      },
      defaultProps: {
        title: 'Ready to get started?',
        subtitle: 'Join thousands of teams building with us.',
        buttonText: 'Start free trial',
        accent: 'orange',
      },
      render: (props: Record<string, unknown>) => {
        const accent = (props.accent as string) || 'orange';
        return (
          <section className="py-16 px-4 bg-gray-900 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{props.title as string}</h2>
              <p className="text-lg text-gray-400 mb-8">{props.subtitle as string}</p>
              <a
                href="#"
                className={`inline-flex px-8 py-4 text-base font-semibold rounded-xl text-white shadow-lg transition-all hover:-translate-y-0.5 ${accentClasses[accent] || accentClasses.orange}`}
              >
                {props.buttonText as string}
              </a>
            </div>
          </section>
        );
      },
    },
  },
  categories: [
    { title: 'Basic', components: ['HeadingBlock', 'TextBlock', 'StyledHeading'] },
    { title: 'Sections', components: ['HeroBlock', 'GradientSection', 'ImageBackgroundSection', 'AnimatedBlock', 'Hero01', 'Hero02', 'CTA01'] },
    { title: 'Header', components: ['Header01'] },
    { title: 'Import', components: ['ImportedHTML'] },
  ],
};
