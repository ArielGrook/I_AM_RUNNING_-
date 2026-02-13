/**
 * ProductCard1 - E-commerce Product Card
 *
 * Features:
 * - Mobile-first responsive
 * - Touch-friendly (min 44px buttons)
 * - Hover effects (desktop only)
 * - Star rating display
 * - GSAP animation data-attributes
 * - WCAG 2.1 AA accessible
 * - Ready for API integration (props with defaults)
 *
 * Note: When rendered to static HTML via renderToStaticMarkup,
 * default prop values are used and onClick handlers are stripped.
 * This produces clean static HTML suitable for GrapesJS.
 */

interface ProductCard1Props {
  image?: string
  title?: string
  price?: number
  rating?: number
  onAddToCart?: () => void
}

export default function ProductCard1({
  image = '/placeholder-product.jpg',
  title = 'Product Name',
  price = 99.99,
  rating = 4.5,
}: ProductCard1Props) {
  return (
    <article
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
      data-animate="card"
      data-animate-type="fade-in"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Quick View overlay (desktop only) */}
        <div
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100"
          aria-hidden="true"
        >
          <span className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium shadow-lg">
            Quick View
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 md:p-6">
        {/* Rating */}
        <div
          className="flex items-center mb-2"
          data-animate="rating"
          data-animate-delay="0.1"
        >
          <div
            className="flex text-orange-400"
            role="img"
            aria-label={`Rating: ${rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${star <= Math.round(rating) ? 'fill-current' : 'fill-gray-300'}`}
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            ({rating})
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-lg md:text-xl font-semibold text-gray-900 mb-2 line-clamp-2"
          data-animate="title"
          data-animate-delay="0.2"
        >
          {title}
        </h3>

        {/* Price */}
        <p
          className="text-2xl font-bold text-orange-600 mb-4"
          data-animate="price"
          data-animate-delay="0.3"
        >
          ${price.toFixed(2)}
        </p>

        {/* Add to Cart Button */}
        <button
          type="button"
          className="w-full py-3 px-6 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow hover:shadow-lg"
          data-animate="button"
          data-animate-delay="0.4"
          aria-label={`Add ${title} to cart`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Add to Cart
        </button>
      </div>
    </article>
  )
}
