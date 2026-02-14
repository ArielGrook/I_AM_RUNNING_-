export const hero01 = {
  id: 'premium-hero-01',
  name: 'Gradient Hero',
  category: 'hero',
  description: 'Full-screen gradient hero with centered content, dual CTAs, and floating accent shapes',
  style: 'modern_gradient' as const,
  tags: ['hero', 'gradient', 'cta', 'modern'],
  animation_preset: 'fade-up',
  html: `<section class="iamr-hero-01 relative overflow-hidden" data-animate="fade-up">
  <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
  <div class="absolute top-20 left-10 w-72 h-72 bg-[#FF6B35] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
  <div class="absolute bottom-20 right-10 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-44 text-center">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-gray-300 mb-8" data-animate="fade-up" data-animate-delay="50">
      <span class="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse"></span>
      Now available — Start building today
    </div>
    <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6" data-animate="fade-up" data-animate-delay="100">
      Build Stunning Websites<br class="hidden sm:block" />
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-orange-300">Without Writing Code</span>
    </h1>
    <p class="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed mb-10" data-animate="fade-up" data-animate-delay="200">
      The modern website builder that combines premium design with drag-and-drop simplicity. Launch your dream website in minutes, not weeks.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center" data-animate="fade-up" data-animate-delay="300">
      <a href="#" class="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-[#FF6B35] hover:bg-[#ff8555] rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5">
        Get Started Free
        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      </a>
      <a href="#" class="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl transition-all duration-300">
        <svg class="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Watch Demo
      </a>
    </div>
    <div class="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-40" data-animate="fade-up" data-animate-delay="400">
      <span class="text-sm text-gray-500 uppercase tracking-wider font-medium">Trusted by</span>
      <span class="text-white font-semibold text-lg">Acme Corp</span>
      <span class="text-white font-semibold text-lg">Globex</span>
      <span class="text-white font-semibold text-lg">Initech</span>
      <span class="text-white font-semibold text-lg">Umbrella</span>
    </div>
  </div>
</section>`,
  css: `.iamr-hero-01{min-height:100vh;display:flex;align-items:center;position:relative}
.iamr-hero-01 h1{text-shadow:0 2px 8px rgba(0,0,0,.15)}
.iamr-hero-01 a{box-shadow:0 4px 14px rgba(0,0,0,.1)}
.iamr-hero-01 a:hover{transform:translateY(-2px)}`,
};
