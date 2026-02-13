/**
 * Hero1 - E-commerce Hero Section
 *
 * Features:
 * - Mobile-first responsive layout
 * - Background gradient with image placeholder
 * - Dual CTA buttons (min 48px height)
 * - GSAP animation data-attributes
 * - WCAG 2.1 AA accessible
 *
 * Used in: Homepage, Landing pages
 */

export default function Hero1() {
  return (
    <section
      className="relative bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden"
      data-animate="section"
      data-animate-type="fade-in"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
              data-animate="heading"
              data-animate-type="slide-up"
              data-animate-delay="0.2"
            >
              Welcome to Our Store
            </h1>

            <p
              className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed"
              data-animate="text"
              data-animate-delay="0.4"
            >
              Discover amazing products with unbeatable prices. Quality you can
              trust, delivered to your door.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              data-animate="cta-group"
              data-animate-delay="0.6"
              data-animate-stagger="0.1"
            >
              <a
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 text-base md:text-lg font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors min-h-[48px] shadow-lg hover:shadow-xl"
                data-animate="cta-button"
              >
                Shop Now
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center px-8 py-4 text-base md:text-lg font-medium text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-colors min-h-[48px] shadow hover:shadow-md border border-gray-200"
                data-animate="cta-button"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Image Placeholder */}
          <div
            className="relative"
            data-animate="image"
            data-animate-type="scale-up"
            data-animate-delay="0.3"
          >
            <div className="aspect-square md:aspect-video lg:aspect-square bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl shadow-2xl flex items-center justify-center">
              <svg
                className="w-24 h-24 md:w-32 md:h-32 text-orange-600 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
