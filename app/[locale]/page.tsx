'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { WhyRunToUs } from '@/components/landing/WhyRunToUs';
import { Evolution } from '@/components/landing/Evolution';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ComponentShowcase } from '@/components/landing/ComponentShowcase';
import { PricingComparison } from '@/components/landing/PricingComparison';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <WhyRunToUs />
      <Evolution />
      <HowItWorks />
      <ComponentShowcase />
      <PricingComparison />
      <Footer />
    </div>
  );
}


