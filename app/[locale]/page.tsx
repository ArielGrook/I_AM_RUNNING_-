'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { OriginStory } from '@/components/landing/OriginStory';
import { TechnologySection } from '@/components/landing/TechnologySection';
import { SpeedSection } from '@/components/landing/SpeedSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { ShowcaseSection } from '@/components/landing/ShowcaseSection';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <HeroSection />
      <OriginStory />
      <TechnologySection />
      <SpeedSection />
      <PricingSection />
      <ServicesSection />
      <ShowcaseSection />
      <Footer />
    </div>
  );
}
