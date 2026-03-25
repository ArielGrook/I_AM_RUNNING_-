import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'ru', 'he', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi'] as const;
const defaultLocale = 'en';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/debug') ||
    pathname.startsWith('/sites') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── Tenant routing for *.lego-base.online ──────────────────
  const host = request.headers.get('host') || '';
  const clientMatch = host.match(/^([^.]+)\.lego-base\.online$/);
  if (clientMatch) {
    const slug = clientMatch[1];
    const response = intlMiddleware(request);
    response.headers.set('x-client-slug', slug);
    return response;
  }
  // ────────────────────────────────────────────────────────────

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next|api|\\.well-known|static|debug|sites|.*\\..*).*)',
    '/'
  ]
};
