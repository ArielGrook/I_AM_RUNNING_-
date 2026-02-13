/**
 * Header1 - Modern E-commerce Header
 *
 * Features:
 * - Mobile-first responsive navigation
 * - Sticky positioning
 * - Touch-friendly targets (min 44px)
 * - GSAP animation data-attributes
 * - WCAG 2.1 AA accessible
 *
 * Used in: E-commerce, Business, Portfolio sites
 */

export default function Header1() {
  return (
    <header
      className="bg-white shadow-sm sticky top-0 z-50"
      data-animate="header"
      data-animate-type="slide-down"
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 md:py-0 md:h-16">
          {/* Logo */}
          <div
            className="flex justify-center md:justify-start mb-4 md:mb-0"
            data-animate="logo"
            data-animate-delay="0.2"
          >
            <a
              href="/"
              className="text-2xl md:text-3xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              YourBrand
            </a>
          </div>

          {/* Navigation Links */}
          <div
            className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-8"
            data-animate="nav-items"
            data-animate-stagger="0.1"
          >
            <a
              href="/"
              className="block py-3 md:py-0 px-4 md:px-0 text-center md:text-left text-base font-medium text-gray-700 hover:text-gray-900 rounded-lg md:rounded-none hover:bg-gray-50 md:hover:bg-transparent transition-colors min-h-[44px] flex items-center justify-center md:justify-start"
              data-animate="nav-item"
            >
              Home
            </a>
            <a
              href="/products"
              className="block py-3 md:py-0 px-4 md:px-0 text-center md:text-left text-base font-medium text-gray-700 hover:text-gray-900 rounded-lg md:rounded-none hover:bg-gray-50 md:hover:bg-transparent transition-colors min-h-[44px] flex items-center justify-center md:justify-start"
              data-animate="nav-item"
            >
              Products
            </a>
            <a
              href="/about"
              className="block py-3 md:py-0 px-4 md:px-0 text-center md:text-left text-base font-medium text-gray-700 hover:text-gray-900 rounded-lg md:rounded-none hover:bg-gray-50 md:hover:bg-transparent transition-colors min-h-[44px] flex items-center justify-center md:justify-start"
              data-animate="nav-item"
            >
              About
            </a>
            <a
              href="/contact"
              className="block py-3 md:py-0 px-4 md:px-0 text-center md:text-left text-base font-medium text-gray-700 hover:text-gray-900 rounded-lg md:rounded-none hover:bg-gray-50 md:hover:bg-transparent transition-colors min-h-[44px] flex items-center justify-center md:justify-start"
              data-animate="nav-item"
            >
              Contact
            </a>

            {/* Cart CTA */}
            <a
              href="/cart"
              className="block py-3 px-6 text-center text-base font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
              data-animate="nav-item"
              data-animate-delay="0.4"
            >
              Cart (0)
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}
