'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { ThreeDoorsSection } from '@/components/landing/ThreeDoorsSection';
import { SpeedSection } from '@/components/landing/SpeedSection';
import { HostingSection } from '@/components/landing/HostingSection';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { Footer } from '@/components/landing/Footer';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#FF6B35] text-white shadow-[0_4px_20px_rgba(255,107,53,0.3)] hover:bg-[#ff7a4b] transition-colors"
          aria-label="Back to top"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background scroll-smooth">
      <HeroSection />
      <ThreeDoorsSection />
      <SpeedSection />
      <HostingSection />
      <SavingsCalculator />
      <FinalCtaSection />
      <Footer />
      <BackToTop />
    </main>
  );
}
