/**
 * Cart1 - Shopping Cart Component
 *
 * Features:
 * - Mobile-first responsive
 * - Touch-friendly quantity controls
 * - Empty state included
 * - Order summary with subtotal/shipping/total
 * - GSAP animation data-attributes
 * - WCAG 2.1 AA accessible
 * - Ready for API integration (props with defaults)
 *
 * Note: When rendered to static HTML via renderToStaticMarkup,
 * default prop values are used and onClick handlers are stripped.
 */

interface CartItem {
  id: string
  image: string
  title: string
  price: number
  quantity: number
}

interface Cart1Props {
  items?: CartItem[]
  onUpdateQuantity?: (id: string, quantity: number) => void
  onRemoveItem?: (id: string) => void
  onCheckout?: () => void
}

export default function Cart1({
  items = [
    {
      id: '1',
      image: '/placeholder-product.jpg',
      title: 'Sample Product',
      price: 99.99,
      quantity: 1,
    },
  ],
}: Cart1Props) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const shipping = subtotal > 0 ? 10 : 0
  const total = subtotal + shipping

  return (
    <section
      className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8"
      data-animate="section"
      data-animate-type="fade-in"
    >
      <h2
        className="text-2xl md:text-3xl font-bold text-gray-900 mb-6"
        data-animate="heading"
      >
        Shopping Cart
      </h2>

      {items.length === 0 ? (
        /* Empty State */
        <div
          className="text-center py-12"
          data-animate="empty-state"
          data-animate-type="scale-up"
        >
          <svg
            className="w-24 h-24 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Start shopping to add items to your cart
          </p>
          <a
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors min-h-[44px]"
          >
            Continue Shopping
          </a>
        </div>
      ) : (
        <div>
          {/* Cart Items */}
          <div
            className="space-y-4 mb-6"
            data-animate="cart-items"
            data-animate-stagger="0.1"
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg"
                data-animate="cart-item"
              >
                {/* Product Image */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full sm:w-24 h-24 object-cover rounded-lg"
                  loading="lazy"
                />

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xl font-bold text-orange-600">
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      aria-label="Decrease quantity"
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
                          d="M20 12H4"
                        />
                      </svg>
                    </button>

                    <span className="w-12 text-center font-medium text-gray-900">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      aria-label="Increase quantity"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Remove ${item.title} from cart`}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div
            className="border-t border-gray-200 pt-6"
            data-animate="summary"
            data-animate-delay="0.3"
          >
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-base text-gray-700">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <span>Shipping</span>
                <span className="font-medium">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              className="w-full py-4 px-8 text-lg font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors min-h-[48px] shadow-lg hover:shadow-xl"
              data-animate="checkout-button"
              data-animate-delay="0.4"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
