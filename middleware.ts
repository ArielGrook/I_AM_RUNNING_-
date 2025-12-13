import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Supported locales (must match i18n.ts)
const locales = ['en', 'ru', 'he', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi'] as const;
const defaultLocale = 'en';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always' // Always show locale prefix to avoid redirect loops
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Apply internationalization middleware (handles root redirect automatically)
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except static files and API routes
    '/((?!_next|api|static|.*\\..*).*)',
    // Include root path
    '/'
  ]
};



