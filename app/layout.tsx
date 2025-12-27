import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "I'm Running - AI Website Builder",
  description: 'Create beautiful websites with AI-powered design tools. No coding required.',
  keywords: ['website builder', 'AI', 'design', 'no-code', 'web development'],
  authors: [{ name: 'I\'m Running Team' }],
  creator: 'I\'m Running',
  publisher: 'I\'m Running',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://iamrunning.online'),
  openGraph: {
    title: "I'm Running - AI Website Builder",
    description: 'Create beautiful websites with AI-powered design tools. No coding required.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://iamrunning.online',
    siteName: "I'm Running",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "I'm Running - AI Website Builder",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "I'm Running - AI Website Builder",
    description: 'Create beautiful websites with AI-powered design tools. No coding required.',
    images: ['/og-image.png'],
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}



