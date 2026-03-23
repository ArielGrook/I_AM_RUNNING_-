'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { ThreeDoorsSection } from '@/components/landing/ThreeDoorsSection';
import { SpeedSection } from '@/components/landing/SpeedSection';
import { HostingSection } from '@/components/landing/HostingSection';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black">
      <HeroSection />
      <ThreeDoorsSection />
      <SpeedSection />
      <HostingSection />
      <SavingsCalculator />
      <FinalCtaSection />
      <Footer />
    </main>
  );
}
