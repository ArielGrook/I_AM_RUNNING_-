export const header03 = {
  id: 'premium-header-03',
  name: 'Minimal Light Header',
  category: 'header',
  description: 'Clean minimal header with thin border, generous spacing, and text-only navigation',
  style: 'minimal_light' as const,
  tags: ['header', 'navigation', 'minimal', 'clean'],
  animation_preset: 'fade-down',
  html: `<header class="iamr-header-03 sticky top-0 z-50 bg-white" data-animate="fade-down">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-20 border-b border-gray-100">
      <a href="#" class="text-2xl font-black text-gray-900 tracking-tight hover:text-[#FF6B35] transition-colors">
        brand<span class="text-[#FF6B35]">.</span>
      </a>
      <nav class="hidden md:flex items-center gap-10" role="navigation" aria-label="Main navigation">
        <a href="#" class="text-sm font-medium text-gray-900 hover:text-[#FF6B35] transition-colors">Work</a>
        <a href="#" class="text-sm font-medium text-gray-500 hover:text-[#FF6B35] transition-colors">Services</a>
        <a href="#" class="text-sm font-medium text-gray-500 hover:text-[#FF6B35] transition-colors">About</a>
        <a href="#" class="text-sm font-medium text-gray-500 hover:text-[#FF6B35] transition-colors">Blog</a>
      </nav>
      <div class="flex items-center gap-4">
        <a href="#" class="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
        <a href="#" class="group inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-[#FF6B35] rounded-full transition-all duration-300">
          Let's Talk
          <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </a>
        <button type="button" class="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg" aria-label="Open menu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
  </div>
</header>`,
  css: `.iamr-header-03{box-shadow:0 1px 0 rgba(0,0,0,.03)}`,
};
