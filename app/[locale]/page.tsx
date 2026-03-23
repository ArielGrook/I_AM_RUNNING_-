'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { SpeedSection } from '@/components/landing/SpeedSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { Footer } from '@/components/landing/Footer';
import { ThreeDoorsSection } from '@/components/landing/ThreeDoorsSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import ClientLanding from '@/app/[locale]/client-home/page';

// If this is a client instance (CLIENT_SLUG set), show client onboarding instead
const IS_CLIENT_INSTANCE = !!process.env.NEXT_PUBLIC_CLIENT_SLUG;

export default function LandingPage() {
  if (IS_CLIENT_INSTANCE) return <ClientLanding />;

  return (
    <main className="min-h-screen bg-black">
      <HeroSection />
      <ThreeDoorsSection />
      <SpeedSection />
      <ServicesSection />
      <PricingSection />
      <FinalCtaSection />
      <Footer />
    </main>
  );
}