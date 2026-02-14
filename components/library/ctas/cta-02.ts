export const cta02 = {
  id: 'premium-cta-02',
  name: 'Split CTA with Form',
  category: 'cta',
  description: 'Split layout with compelling text left and email signup form right, dark background',
  style: 'modern_dark' as const,
  tags: ['cta', 'form', 'email', 'split'],
  animation_preset: 'fade-up',
  html: `<section class="iamr-cta-02 bg-gray-900" data-animate="fade-up">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      <div data-animate="fade-right" data-animate-delay="100">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B35]/10 mb-6">
          <svg class="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <span class="text-sm font-medium text-[#FF6B35]">Limited spots available</span>
        </div>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
          Don't miss out.<br />
          <span class="text-gray-500">Join the waitlist.</span>
        </h2>
        <p class="text-lg text-gray-400 leading-relaxed mb-8 max-w-md">
          Be the first to access our premium features. Early members get exclusive pricing and priority support.
        </p>
        <div class="flex items-center gap-6">
          <div class="flex -space-x-2">
            <div class="w-8 h-8 rounded-full bg-[#FF6B35] border-2 border-gray-900 flex items-center justify-center text-xs text-white font-bold">A</div>
            <div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-gray-900 flex items-center justify-center text-xs text-white font-bold">B</div>
            <div class="w-8 h-8 rounded-full bg-green-500 border-2 border-gray-900 flex items-center justify-center text-xs text-white font-bold">C</div>
            <div class="w-8 h-8 rounded-full bg-purple-500 border-2 border-gray-900 flex items-center justify-center text-xs text-white font-bold">D</div>
          </div>
          <span class="text-sm text-gray-400"><strong class="text-white">2,847</strong> people already joined</span>
        </div>
      </div>
      <div data-animate="fade-left" data-animate-delay="200">
        <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          <h3 class="text-xl font-bold text-white mb-2">Get Early Access</h3>
          <p class="text-sm text-gray-400 mb-6">Enter your email to reserve your spot.</p>
          <form class="space-y-4">
            <div>
              <label for="cta-name" class="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <input id="cta-name" type="text" placeholder="John Doe" class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors" />
            </div>
            <div>
              <label for="cta-email" class="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input id="cta-email" type="email" placeholder="john@example.com" class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-colors" />
            </div>
            <button type="submit" class="w-full px-6 py-3.5 bg-[#FF6B35] hover:bg-[#ff8555] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30">
              Join the Waitlist
            </button>
          </form>
          <p class="mt-4 text-xs text-gray-500 text-center">No spam, ever. Unsubscribe at any time.</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
  css: `.iamr-cta-02 input:focus{box-shadow:0 0 0 3px rgba(255,107,53,.15)}
.iamr-cta-02 button[type=submit]:hover{transform:translateY(-1px)}`,
};
