export const cta01 = {
  id: 'premium-cta-01',
  name: 'Gradient CTA',
  category: 'cta',
  description: 'Bold gradient CTA section with centered headline, subtitle, and dual buttons',
  style: 'modern_gradient' as const,
  tags: ['cta', 'gradient', 'conversion', 'bold'],
  animation_preset: 'zoom-in',
  html: `<section class="iamr-cta-01 relative overflow-hidden" data-animate="zoom-in">
  <div class="absolute inset-0 bg-gradient-to-r from-[#FF6B35] via-orange-500 to-amber-500"></div>
  <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;20&quot; height=&quot;20&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Ccircle cx=&quot;1&quot; cy=&quot;1&quot; r=&quot;1&quot; fill=&quot;rgba(255,255,255,0.07)&quot;/%3E%3C/svg%3E')]"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
    <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6" data-animate="fade-up" data-animate-delay="100">
      Ready to Build Something<br class="hidden sm:block" /> Amazing?
    </h2>
    <p class="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10" data-animate="fade-up" data-animate-delay="200">
      Join thousands of creators who build stunning websites without writing a single line of code. Start your free trial today.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center" data-animate="fade-up" data-animate-delay="300">
      <a href="#" class="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-[#FF6B35] bg-white hover:bg-gray-50 rounded-xl shadow-xl shadow-black/10 transition-all duration-200 hover:-translate-y-0.5">
        Get Started Free
        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      </a>
      <a href="#" class="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 rounded-xl transition-all duration-200">
        Talk to Sales
      </a>
    </div>
    <p class="mt-6 text-sm text-white/60" data-animate="fade-up" data-animate-delay="400">No credit card required &middot; Free 14-day trial</p>
  </div>
</section>`,
  css: `.iamr-cta-01 a:first-of-type:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(0,0,0,.15)}`,
};
