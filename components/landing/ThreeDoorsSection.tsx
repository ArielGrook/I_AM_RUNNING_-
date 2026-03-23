'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLocale } from 'next-intl';

/* ── Detailed SVG illustrations for each door ── */

function MobilePhoneSVG() {
  return (
    <svg viewBox="0 0 180 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Phone body */}
      <rect x="30" y="10" width="120" height="220" rx="20" fill="currentColor" opacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
      {/* Screen */}
      <rect x="40" y="35" width="100" height="170" rx="8" fill="currentColor" opacity="0.04"/>
      {/* Notch */}
      <rect x="65" y="16" width="50" height="8" rx="4" fill="currentColor" opacity="0.1"/>
      {/* Hero block */}
      <rect x="48" y="45" width="84" height="36" rx="6" fill="#FF6B35" opacity="0.35"/>
      <rect x="54" y="52" width="40" height="4" rx="2" fill="white" opacity="0.5"/>
      <rect x="54" y="60" width="60" height="3" rx="1.5" fill="white" opacity="0.3"/>
      <rect x="54" y="67" width="30" height="8" rx="4" fill="white" opacity="0.4"/>
      {/* Cards */}
      <rect x="48" y="88" width="38" height="32" rx="5" fill="currentColor" opacity="0.06" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
      <rect x="94" y="88" width="38" height="32" rx="5" fill="currentColor" opacity="0.06" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
      {/* Content lines */}
      <rect x="48" y="128" width="84" height="3" rx="1.5" fill="currentColor" opacity="0.08"/>
      <rect x="48" y="136" width="60" height="3" rx="1.5" fill="currentColor" opacity="0.06"/>
      {/* CTA */}
      <rect x="48" y="150" width="84" height="14" rx="7" fill="#FF6B35" opacity="0.25"/>
      <rect x="65" y="155" width="50" height="4" rx="2" fill="white" opacity="0.4"/>
      {/* Bottom bar */}
      <rect x="48" y="175" width="84" height="22" rx="5" fill="currentColor" opacity="0.04"/>
      <circle cx="68" cy="186" r="4" fill="currentColor" opacity="0.08"/>
      <circle cx="90" cy="186" r="4" fill="#FF6B35" opacity="0.2"/>
      <circle cx="112" cy="186" r="4" fill="currentColor" opacity="0.08"/>
      {/* Home indicator */}
      <rect x="72" y="212" width="36" height="4" rx="2" fill="currentColor" opacity="0.1"/>
    </svg>
  );
}

function EditorSVG() {
  return (
    <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Window frame */}
      <rect x="5" y="5" width="250" height="170" rx="10" fill="currentColor" opacity="0.05" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
      {/* Title bar */}
      <rect x="5" y="5" width="250" height="24" rx="10" fill="currentColor" opacity="0.06"/>
      <rect x="5" y="19" width="250" height="10" fill="currentColor" opacity="0.06"/>
      {/* Traffic lights */}
      <circle cx="20" cy="17" r="4" fill="#ff5f57"/>
      <circle cx="32" cy="17" r="4" fill="#febc2e"/>
      <circle cx="44" cy="17" r="4" fill="#28c840"/>
      {/* Left sidebar — toolbox */}
      <rect x="5" y="29" width="44" height="146" fill="currentColor" opacity="0.04"/>
      <line x1="49" y1="29" x2="49" y2="175" stroke="currentColor" strokeOpacity="0.08"/>
      {/* Toolbox items */}
      <rect x="12" y="38" width="30" height="18" rx="4" fill="currentColor" opacity="0.07"/>
      <rect x="12" y="62" width="30" height="18" rx="4" fill="currentColor" opacity="0.07"/>
      <rect x="12" y="86" width="30" height="18" rx="4" fill="#FF6B35" opacity="0.2"/>
      <rect x="12" y="110" width="30" height="18" rx="4" fill="currentColor" opacity="0.07"/>
      {/* Canvas area */}
      <rect x="55" y="35" width="140" height="134" rx="4" fill="currentColor" opacity="0.02"/>
      {/* Dragged component */}
      <rect x="65" y="42" width="120" height="30" rx="5" fill="#FF6B35" opacity="0.15" stroke="#FF6B35" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 2"/>
      <rect x="72" y="50" width="50" height="3" rx="1.5" fill="#FF6B35" opacity="0.4"/>
      <rect x="72" y="57" width="80" height="2.5" rx="1.25" fill="currentColor" opacity="0.12"/>
      {/* Placed components */}
      <rect x="65" y="80" width="120" height="24" rx="4" fill="currentColor" opacity="0.05" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
      <rect x="72" y="87" width="40" height="3" rx="1.5" fill="currentColor" opacity="0.12"/>
      <rect x="72" y="93" width="70" height="2" rx="1" fill="currentColor" opacity="0.08"/>
      <rect x="65" y="110" width="56" height="50" rx="4" fill="currentColor" opacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
      <rect x="129" y="110" width="56" height="50" rx="4" fill="currentColor" opacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
      {/* Right sidebar — settings */}
      <rect x="201" y="29" width="54" height="146" fill="currentColor" opacity="0.04"/>
      <line x1="201" y1="29" x2="201" y2="175" stroke="currentColor" strokeOpacity="0.08"/>
      <rect x="208" y="38" width="40" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="208" y="50" width="40" height="8" rx="3" fill="currentColor" opacity="0.06"/>
      <rect x="208" y="66" width="40" height="8" rx="3" fill="currentColor" opacity="0.06"/>
      <rect x="208" y="82" width="40" height="8" rx="3" fill="#FF6B35" opacity="0.15"/>
      <rect x="208" y="100" width="40" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="208" y="112" width="40" height="8" rx="3" fill="currentColor" opacity="0.06"/>
      {/* Cursor */}
      <path d="M152 65l-3-2v12l3-3 4 6h4l-5-7 5-2-8-4z" fill="#FF6B35" opacity="0.6"/>
    </svg>
  );
}

function BusinessSVG() {
  return (
    <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Dashboard frame */}
      <rect x="10" y="10" width="200" height="160" rx="12" fill="currentColor" opacity="0.05" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
      {/* Top bar */}
      <rect x="10" y="10" width="200" height="22" rx="12" fill="currentColor" opacity="0.06"/>
      <rect x="10" y="22" width="200" height="10" fill="currentColor" opacity="0.06"/>
      <rect x="22" y="17" width="50" height="4" rx="2" fill="#FF6B35" opacity="0.4"/>
      <circle cx="190" cy="21" r="6" fill="currentColor" opacity="0.08"/>
      {/* Sidebar */}
      <rect x="10" y="32" width="42" height="138" fill="currentColor" opacity="0.04"/>
      <line x1="52" y1="32" x2="52" y2="170" stroke="currentColor" strokeOpacity="0.08"/>
      <rect x="17" y="40" width="28" height="6" rx="3" fill="#FF6B35" opacity="0.2"/>
      <rect x="17" y="54" width="28" height="6" rx="3" fill="currentColor" opacity="0.06"/>
      <rect x="17" y="68" width="28" height="6" rx="3" fill="currentColor" opacity="0.06"/>
      <rect x="17" y="82" width="28" height="6" rx="3" fill="currentColor" opacity="0.06"/>
      {/* KPI cards */}
      <rect x="60" y="40" width="42" height="30" rx="6" fill="currentColor" opacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
      <rect x="66" y="47" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.1"/>
      <rect x="66" y="55" width="30" height="5" rx="2" fill="#FF6B35" opacity="0.35"/>
      <rect x="110" y="40" width="42" height="30" rx="6" fill="currentColor" opacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
      <rect x="116" y="47" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.1"/>
      <rect x="116" y="55" width="30" height="5" rx="2" fill="#28c840" opacity="0.35"/>
      <rect x="160" y="40" width="42" height="30" rx="6" fill="currentColor" opacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
      <rect x="166" y="47" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.1"/>
      <rect x="166" y="55" width="30" height="5" rx="2" fill="#7bc6ff" opacity="0.35"/>
      {/* Chart area */}
      <rect x="60" y="78" width="142" height="80" rx="8" fill="currentColor" opacity="0.03" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
      <rect x="66" y="84" width="40" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      {/* Chart bars */}
      <rect x="72" y="130" width="10" height="18" rx="2" fill="currentColor" opacity="0.08"/>
      <rect x="88" y="118" width="10" height="30" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="104" y="110" width="10" height="38" rx="2" fill="#FF6B35" opacity="0.3"/>
      <rect x="120" y="122" width="10" height="26" rx="2" fill="currentColor" opacity="0.08"/>
      <rect x="136" y="105" width="10" height="43" rx="2" fill="#FF6B35" opacity="0.25"/>
      <rect x="152" y="98" width="10" height="50" rx="2" fill="#FF6B35" opacity="0.4"/>
      <rect x="168" y="108" width="10" height="40" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="184" y="95" width="10" height="53" rx="2" fill="#FF6B35" opacity="0.35"/>
      {/* AI badge */}
      <rect x="150" y="82" width="46" height="14" rx="7" fill="#FF6B35" opacity="0.2" stroke="#FF6B35" strokeOpacity="0.3" strokeWidth="0.8"/>
      <text x="160" y="92" fontSize="7" fill="#FF6B35" opacity="0.7" fontWeight="bold">AI-native</text>
    </svg>
  );
}

/* ── Arrow icon SVG ── */
function ArrowRightSVG({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function ThreeDoorsSection() {
  const locale = useLocale();

  return (
    <section id="doors" className="relative bg-background py-20 sm:py-28 overflow-hidden">
      {/* Subtle top gradient from hero */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-foreground/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Three doors. One platform.
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
            Choose how you want to{' '}
            <span className="text-[#FF6B35]">start running</span>
          </h2>
          <p className="mt-5 text-foreground/60 sm:text-lg leading-relaxed">
            Start fast with mobile, build professionally in the editor, or go fully custom with AI-native business software.
          </p>
        </motion.div>

        {/* Three cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Door A: Interactive ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            className="group relative rounded-3xl border border-foreground/8 bg-foreground/[0.02] p-6 transition-all duration-300 hover:border-foreground/15 hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
          >
            {/* Label */}
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.25em] text-foreground/35 font-medium">Door A</div>
              <div className="rounded-full bg-[#FF6B35]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF6B35]">
                mobile-first
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground">Interactive</h3>

            {/* SVG Illustration */}
            <div className="my-5 h-48 text-foreground transition-transform duration-500 group-hover:scale-[1.02]">
              <MobilePhoneSVG />
            </div>

            <p className="text-foreground/65 leading-relaxed">
              Build your dream website from your phone in 15&nbsp;minutes — whether it&apos;s a landing page or an online store.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground/45">mobile flow</span>
              <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground/45">fast launch</span>
              <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground/45">simple onboarding</span>
            </div>

            <Button asChild className="mt-6 w-full rounded-full bg-[#FF6B35] text-white hover:bg-[#ff7a4b] font-black transition-all hover:scale-[1.01]">
              <Link href={`/${locale}/interactive`}>
                Run Interactive
                <ArrowRightSVG className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* ── Door B: Editor ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: 0.1 }}
            className="group relative rounded-3xl border border-foreground/8 bg-foreground/[0.02] p-6 transition-all duration-300 hover:border-foreground/15 hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.25em] text-foreground/35 font-medium">Door B</div>
              <div className="rounded-full bg-[#7bc6ff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7bc6ff]">
                professional
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground">Editor</h3>

            <div className="my-5 h-48 text-foreground transition-transform duration-500 group-hover:scale-[1.02]">
              <EditorSVG />
            </div>

            <p className="text-foreground/65 leading-relaxed">
              Build professional white-label websites with backend directly in your browser.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground/45">drag & drop</span>
              <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground/45">white-label</span>
              <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground/45">backend</span>
            </div>

            <Button
              asChild
              className="mt-6 w-full rounded-full bg-foreground/8 text-foreground hover:bg-foreground/12 font-black border border-foreground/10 transition-all hover:scale-[1.01]"
            >
              <Link href={`/${locale}/auth/login?redirect=/${locale}/dashboard`}>
                Run Editor
                <ArrowRightSVG className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* ── Door C: Business Software ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: 0.2 }}
            className="group relative rounded-3xl border border-[#FF6B35]/25 bg-gradient-to-br from-[#FF6B35]/[0.06] to-transparent p-6 transition-all duration-300 hover:border-[#FF6B35]/40 hover:shadow-[0_20px_80px_rgba(255,107,53,0.1)] dark:hover:shadow-[0_20px_80px_rgba(255,107,53,0.15)]"
          >
            {/* Most powerful badge */}
            <div className="absolute right-5 top-5 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#FF6B35]">
              most powerful
            </div>

            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.25em] text-foreground/35 font-medium">Door C</div>
            </div>
            <h3 className="text-2xl font-black text-foreground">Business Software</h3>

            <div className="my-5 h-48 text-foreground transition-transform duration-500 group-hover:scale-[1.02]">
              <BusinessSVG />
            </div>

            <p className="text-foreground/80 leading-relaxed">
              Custom AI-native software by I AM RUNNING.
            </p>
            <p className="mt-1 text-sm text-[#FF6B35]/80">
              Our most powerful product — built around your business goals.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#FF6B35]/8 px-3 py-1.5 text-[#FF6B35]/70">consultation</span>
              <span className="rounded-full bg-[#FF6B35]/8 px-3 py-1.5 text-[#FF6B35]/70">custom plan</span>
              <span className="rounded-full bg-[#FF6B35]/8 px-3 py-1.5 text-[#FF6B35]/70">AI-native</span>
            </div>

            <Button
              asChild
              className="mt-6 w-full rounded-full bg-[#FF6B35] text-white hover:bg-[#ff7a4b] font-black shadow-[0_4px_24px_rgba(255,107,53,0.25)] transition-all hover:scale-[1.01] hover:shadow-[0_8px_32px_rgba(255,107,53,0.35)]"
            >
              <Link href="mailto:hello@iamrunning.online?subject=Business%20Software%20Consultation">
                Run Business
                <ArrowRightSVG className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
