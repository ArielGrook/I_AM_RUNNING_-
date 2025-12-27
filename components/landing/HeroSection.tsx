'use client';

import Link from 'next/link';
import { ArrowRight, PlayCircle, Zap, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function HeroSection() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.25),transparent_30%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center text-lg font-bold shadow-lg">
            🏃‍♂️
          </div>
          <div>
            <div className="text-sm uppercase tracking-widest text-white/80">I AM RUNNING</div>
            <div className="text-xs text-white/70">Price. Quality. Speed.</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/editor"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white text-indigo-700 px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition"
          >
            Launch Editor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow">
              <Zap className="h-4 w-4" /> Stop chasing. Start running.
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Stop chasing expensive solutions.
              <span className="block text-orange-200">
                I AM RUNNING towards your perfect website.
              </span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl">
              While others make you wait weeks and charge $500+, people run to us for PRICE, QUALITY, and
              SPEED — delivered in under 30 minutes with AI-orchestrated components.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="px-8 py-6 text-lg shadow-lg hover:shadow-xl">
                <Link href="/editor">
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="px-8 py-6 text-lg bg-white/15 text-white border border-white/30 hover:bg-white/25"
                asChild
              >
                <Link href="#demo">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-white/80">
              <Stat label="Price" value="$20-200" detail="vs $500+ competitors" />
              <Stat label="Speed" value="<30 min" detail="from idea to live draft" />
              <Stat label="Quality" value="AI + Pro" detail="20 styles, 49 tags" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-orange-400 blur-3xl opacity-60" />
            <div className="absolute -right-8 bottom-8 h-20 w-20 rounded-full bg-cyan-400 blur-3xl opacity-60" />
            <div className="relative rounded-3xl bg-white/10 border border-white/20 shadow-2xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4 text-sm text-white/80">
                <span>Components assembling...</span>
                <Rocket className="h-5 w-5 text-orange-200" />
              </div>
              <div className="space-y-3 text-sm">
                {['Header (modern_gradient)', 'Hero (creative_colorful)', 'CTA (tech_neon)', 'Footer (classic_elegant)'].map(
                  (item, idx) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{item}</div>
                          <div className="text-white/60 text-xs">running into place...</div>
                        </div>
                      </div>
                      <div className="h-2 w-16 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full w-2/3 bg-white/80 animate-pulse" />
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="mt-6 text-center text-sm text-white/80">
                Components are “running” together to form your site.
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-white/70">{label}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="text-xs text-white/70">{detail}</div>
    </div>
  );
}


