export const hero03 = {
  id: 'premium-hero-03',
  name: 'Minimal Dark Hero',
  category: 'hero',
  description: 'Minimal dark hero with oversized typography, subtle grid background, and animated accent line',
  style: 'minimal_dark' as const,
  tags: ['hero', 'minimal', 'dark', 'typography'],
  animation_preset: 'fade-up',
  html: `<section class="iamr-hero-03 relative bg-[#0a0a0a] overflow-hidden" data-animate="fade-up">
  <div class="absolute inset-0 opacity-[0.03]" style="background-image:url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36 lg:py-48">
    <div class="max-w-4xl">
      <div class="flex items-center gap-4 mb-10" data-animate="fade-right" data-animate-delay="50">
        <div class="h-px w-12 bg-[#FF6B35]"></div>
        <span class="text-sm font-medium text-[#FF6B35] uppercase tracking-widest">Website Builder</span>
      </div>
      <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight mb-8" data-animate="fade-up" data-animate-delay="100">
        Create.<br />
        <span class="text-gray-600">Publish.</span><br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] via-orange-400 to-amber-300">Grow.</span>
      </h1>
      <p class="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl mb-12" data-animate="fade-up" data-animate-delay="200">
        Professional websites built with premium components. No templates. No compromises. Just pure, beautiful design.
      </p>
      <div class="flex flex-col sm:flex-row gap-4" data-animate="fade-up" data-animate-delay="300">
        <a href="#" class="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-black bg-white hover:bg-gray-100 rounded-lg transition-all duration-200">
          Start Free
          <svg class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </a>
        <a href="#" class="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 rounded-lg transition-all duration-200">
          View Showcase
        </a>
      </div>
    </div>
    <div class="absolute bottom-12 right-8 lg:right-16 hidden lg:flex flex-col items-end gap-2 text-right" data-animate="fade-left" data-animate-delay="400">
      <span class="text-7xl font-black text-white/5">01</span>
    </div>
  </div>
</section>`,
  css: `.iamr-hero-03{min-height:100vh;display:flex;align-items:center}
.iamr-hero-03 h1{letter-spacing:-.03em}`,
};
