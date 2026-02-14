export const hero02 = {
  id: 'premium-hero-02',
  name: 'Split Hero',
  category: 'hero',
  description: 'Split-screen hero with text left, image/visual right, feature badges',
  style: 'modern_light' as const,
  tags: ['hero', 'split', 'image', 'modern'],
  animation_preset: 'fade-right',
  html: `<section class="iamr-hero-02 bg-white" data-animate="fade-up">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[90vh] py-16 lg:py-0">
      <div class="space-y-8" data-animate="fade-right" data-animate-delay="100">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100">
          <span class="w-1.5 h-1.5 rounded-full bg-[#FF6B35]"></span>
          <span class="text-sm font-medium text-[#FF6B35]">New Release v2.0</span>
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
          Design, Build &amp;
          <span class="relative inline-block">
            <span class="relative z-10">Launch</span>
            <span class="absolute bottom-1 left-0 w-full h-3 bg-[#FF6B35]/20 -z-0 rounded"></span>
          </span>
          <br />Faster Than Ever
        </h1>
        <p class="text-lg text-gray-600 leading-relaxed max-w-lg">
          A powerful drag-and-drop builder with premium components, responsive layouts, and one-click deployment. Everything you need in one place.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <a href="#" class="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-white bg-[#FF6B35] hover:bg-[#e65a2a] rounded-xl transition-all duration-200 shadow-lg shadow-orange-200">
            Start Building
            <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
          <a href="#" class="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200">
            See Examples
          </a>
        </div>
        <div class="flex items-center gap-6 pt-4 border-t border-gray-100">
          <div class="text-center"><span class="block text-2xl font-bold text-gray-900">50K+</span><span class="text-xs text-gray-500">Users</span></div>
          <div class="w-px h-10 bg-gray-200"></div>
          <div class="text-center"><span class="block text-2xl font-bold text-gray-900">4.9</span><span class="text-xs text-gray-500">Rating</span></div>
          <div class="w-px h-10 bg-gray-200"></div>
          <div class="text-center"><span class="block text-2xl font-bold text-gray-900">99%</span><span class="text-xs text-gray-500">Uptime</span></div>
        </div>
      </div>
      <div class="relative" data-animate="fade-left" data-animate-delay="200">
        <div class="aspect-square rounded-3xl bg-gradient-to-br from-orange-50 via-white to-gray-50 border border-gray-200/60 shadow-2xl shadow-gray-200/50 overflow-hidden flex items-center justify-center">
          <div class="text-center space-y-3 p-8">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#FF6B35] to-orange-400 flex items-center justify-center shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <p class="text-lg font-semibold text-gray-800">Your Website Preview</p>
            <p class="text-sm text-gray-500">Drop an image here or customize this area</p>
          </div>
        </div>
        <div class="absolute -bottom-4 -left-4 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center gap-3" data-animate="zoom-in" data-animate-delay="400">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>
          <div><p class="text-sm font-semibold text-gray-900">Mobile Optimized</p><p class="text-xs text-gray-500">Looks great everywhere</p></div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  css: `.iamr-hero-02{position:relative;overflow:hidden}
.iamr-hero-02 h1 span span:last-child{transition:width .4s ease}`,
};
