import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LoadingProvider } from '@/components/providers/loading-provider';
import { CookieConsentWrapper } from '@/components/CookieConsentWrapper';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { DarkModeInit } from '@/components/DarkModeInit';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://iamrunning.online';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    const s = data || {};

    const title = s.meta_title || 'I AM RUNNING';
    const description = s.meta_description || 'Create professional websites in minutes. No code required.';
    const canonical = s.canonical_url || BASE_URL;

    return {
      title,
      description,
      keywords: s.meta_keywords || 'website builder, landing page, no-code, saas',
      authors: [{ name: 'I\'m Running Team' }],
      creator: 'I\'m Running',
      publisher: 'I\'m Running',
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL(canonical),
      openGraph: {
        title: s.og_title || s.meta_title || title,
        description: s.og_description || s.meta_description || description,
        images: s.og_image ? [{ url: s.og_image }] : [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
        url: canonical,
        siteName: 'I AM RUNNING',
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: (s.twitter_card as 'summary_large_image' | 'summary' | undefined) || 'summary_large_image',
        title: s.og_title || s.meta_title || title,
        description: s.og_description || s.meta_description || description,
        images: s.og_image ? [s.og_image] : ['/og-image.png'],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        google: process.env.GOOGLE_VERIFICATION,
      },
    };
  } catch {
    // Fallback if Supabase fails or site_settings is empty
    return {
      title: 'I AM RUNNING',
      description: 'Create professional websites in minutes. No code required.',
      metadataBase: new URL(BASE_URL),
      openGraph: {
        title: 'I AM RUNNING — Website Builder',
        description: 'Create professional websites in minutes.',
        url: BASE_URL,
        siteName: 'I AM RUNNING',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'I AM RUNNING' }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'I AM RUNNING — Website Builder',
        description: 'Create professional websites in minutes.',
        images: ['/og-image.png'],
      },
      robots: { index: true, follow: true },
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: RTL is handled per-page in [locale] layout
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DarkModeInit />
          <AuthProvider>
            <LoadingProvider>
              {children}
              <CookieConsentWrapper />
            </LoadingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



