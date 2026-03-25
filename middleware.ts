import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'ru', 'he', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi'] as const;
const defaultLocale = 'en';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

// Paths that client sites should NOT redirect to client-home
// (admin, auth, api — let them through as-is)
const CLIENT_PASSTHROUGH = ['/admin', '/auth', '/api', '/client-home'];

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

    // Check if path is a passthrough (admin, auth, client-home itself)
    const isPassthrough = CLIENT_PASSTHROUGH.some(p =>
      pathname.startsWith(p) ||
      // also handle locale-prefixed versions: /en/admin, /ru/admin etc.
      locales.some(locale => pathname.startsWith(`/${locale}${p}`))
    );

    if (!isPassthrough) {
      // Redirect root and all non-admin paths to client-home
      const url = request.nextUrl.clone();
      url.pathname = '/en/client-home';
      const redirect = NextResponse.redirect(url);
      redirect.headers.set('x-client-slug', slug);
      return redirect;
    }

    // Passthrough — just add the slug header
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
