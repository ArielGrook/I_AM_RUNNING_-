'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { OriginStory } from '@/components/landing/OriginStory';
import { TechnologySection } from '@/components/landing/TechnologySection';
import { SpeedSection } from '@/components/landing/SpeedSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { ShowcaseSection } from '@/components/landing/ShowcaseSection';
import { Footer } from '@/components/landing/Footer';
import ClientLanding from '@/app/[locale]/client-home/page';

// If this is a client instance (CLIENT_SLUG set), show client onboarding instead
const IS_CLIENT_INSTANCE = !!process.env.NEXT_PUBLIC_CLIENT_SLUG;

export default function LandingPage() {
  if (IS_CLIENT_INSTANCE) return <ClientLanding />;

  return (
    <main className="min-h-screen">
      <HeroSection />
      <OriginStory />
      <TechnologySection />
      <SpeedSection />
      <PricingSection />
      <ServicesSection />
      <ShowcaseSection />
      <Footer />
    </main>
  );
}
