export const header02 = {
  id: 'premium-header-02',
  name: 'Dark Topbar Header',
  category: 'header',
  description: 'Dark header with announcement bar on top, logo left, centered nav, auth buttons right',
  style: 'modern_dark' as const,
  tags: ['header', 'navigation', 'dark', 'announcement'],
  animation_preset: 'fade-down',
  html: `<header class="iamr-header-02" data-animate="fade-down">
  <div class="bg-[#FF6B35] text-white text-center py-2 px-4 text-sm font-medium">
    Limited offer — <strong>25% off</strong> all plans this month
    <a href="#" class="underline ml-2 hover:text-orange-100 transition-colors">Learn more &rarr;</a>
  </div>
  <div class="bg-gray-900 border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <a href="#" class="flex items-center gap-2 shrink-0">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-orange-400 flex items-center justify-center">
            <span class="text-white font-bold text-sm">B</span>
          </div>
          <span class="text-lg font-bold text-white">BrandName</span>
        </a>
        <nav class="hidden lg:flex items-center gap-8" role="navigation" aria-label="Main navigation">
          <a href="#" class="text-sm text-gray-300 hover:text-white font-medium transition-colors relative group">
            Products
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6B35] group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#" class="text-sm text-gray-300 hover:text-white font-medium transition-colors relative group">
            Solutions
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6B35] group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#" class="text-sm text-gray-300 hover:text-white font-medium transition-colors relative group">
            Resources
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6B35] group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#" class="text-sm text-gray-300 hover:text-white font-medium transition-colors relative group">
            Pricing
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6B35] group-hover:w-full transition-all duration-300"></span>
          </a>
        </nav>
        <div class="flex items-center gap-3">
          <a href="#" class="hidden md:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign in</a>
          <a href="#" class="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#ff8555] rounded-lg transition-all duration-200">
            Start Free Trial
          </a>
          <button type="button" class="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" aria-label="Open menu">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</header>`,
  css: `.iamr-header-02{position:sticky;top:0;z-index:50}
.iamr-header-02 nav a span{transition:width .3s ease}`,
};
