export const cta03 = {
  id: 'premium-cta-03',
  name: 'Card CTA with Stats',
  category: 'cta',
  description: 'Floating card CTA on light background with stats row, subtle border, and single email input',
  style: 'modern_light' as const,
  tags: ['cta', 'card', 'stats', 'email'],
  animation_preset: 'fade-up',
  html: `<section class="iamr-cta-03 bg-gray-50 py-16 md:py-24" data-animate="fade-up">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden" data-animate="fade-up" data-animate-delay="100">
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B35] via-orange-400 to-amber-400"></div>
      <div class="p-8 md:p-12 lg:p-16 text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 mb-6">
          <svg class="w-7 h-7 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight" data-animate="fade-up" data-animate-delay="150">
          Start Your Journey Today
        </h2>
        <p class="text-lg text-gray-500 max-w-lg mx-auto mb-8" data-animate="fade-up" data-animate-delay="200">
          Get a head start with our premium tools. No setup fee, no hidden charges.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-10" data-animate="fade-up" data-animate-delay="250">
          <input type="email" placeholder="Enter your email" class="flex-1 px-5 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all" />
          <button type="button" class="px-7 py-3.5 bg-[#FF6B35] hover:bg-[#e65a2a] text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-200 shrink-0">
            Subscribe
          </button>
        </div>
        <div class="grid grid-cols-3 gap-8 pt-8 border-t border-gray-100" data-animate="fade-up" data-animate-delay="300">
          <div>
            <div class="text-2xl md:text-3xl font-bold text-gray-900">10K+</div>
            <div class="text-sm text-gray-500 mt-1">Active Users</div>
          </div>
          <div>
            <div class="text-2xl md:text-3xl font-bold text-gray-900">98%</div>
            <div class="text-sm text-gray-500 mt-1">Satisfaction</div>
          </div>
          <div>
            <div class="text-2xl md:text-3xl font-bold text-gray-900">24/7</div>
            <div class="text-sm text-gray-500 mt-1">Support</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  css: `.iamr-cta-03 input:focus{box-shadow:0 0 0 4px rgba(255,107,53,.1)}
.iamr-cta-03 button:hover{transform:translateY(-1px)}`,
};
