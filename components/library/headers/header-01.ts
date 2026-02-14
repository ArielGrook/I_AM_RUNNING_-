export const header01 = {
  id: 'premium-header-01',
  name: 'Glass Header',
  category: 'header',
  description: 'Sticky glass-morphism header with centered logo, horizontal nav, and orange CTA',
  style: 'modern_dark' as const,
  tags: ['header', 'navigation', 'glass', 'sticky'],
  animation_preset: 'fade-down',
  html: `<header class="iamr-header-01 sticky top-0 z-50 w-full" data-animate="fade-down">
  <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-18">
        <a href="#" class="flex items-center gap-2.5 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Brand</span>
        </a>
        <nav class="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          <a href="#" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Home</a>
          <a href="#" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Features</a>
          <a href="#" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Pricing</a>
          <a href="#" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">About</a>
          <a href="#" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Contact</a>
        </nav>
        <div class="flex items-center gap-3">
          <a href="#" class="hidden sm:inline-flex text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF6B35] transition-colors">Log in</a>
          <a href="#" class="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#e65a2a] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
            Get Started
          </a>
          <button type="button" class="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" aria-label="Open menu">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</header>`,
  css: `.iamr-header-01{transition:background-color .3s ease,box-shadow .3s ease}`,
};
