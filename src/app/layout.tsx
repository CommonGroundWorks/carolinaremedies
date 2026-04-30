import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { t } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AgeVerificationProvider } from "@/components/layout/age-verification-provider";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Footer } from "@/components/layout/footer";
import { StorefrontProvider } from "@/components/layout/storefront-provider";
import { ToastContainer } from "@/components/ui/toast";
import { getSiteSettings } from "@/lib/site-settings.server";

// Editorial serif — for display headings, large type
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
  preload: true,
});

// Refined modern sans-serif — for body copy, UI
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-dm-sans',
  preload: true,
});

// Laboratory monospace — for numbers (THC%, prices, quantities)
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${t('site.name')}`,
    default: `${t('site.name')} - ${t('site.tagline')}`,
  },
  description: t('site.description'),
  keywords: 'wellness, hemp, natural products, health, NCRemedies',
  authors: [{ name: 'NCRemedies Team' }],
  creator: 'NCRemedies',
  publisher: 'NCRemedies',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: `${t('site.name')} - ${t('site.tagline')}`,
    description: t('site.description'),
    siteName: t('site.name'),
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${t('site.name')} - ${t('site.tagline')}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${t('site.name')} - ${t('site.tagline')}`,
    description: t('site.description'),
    images: ['/images/og-image.jpg'],
    creator: '@ncremedies',
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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  other: {
    // Sage green — matches the botanical brand primary color
    'msapplication-TileColor': '#508e44',
    'theme-color': '#111009',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <head>
        {/* Viewport — static declaration prevents dynamic injection in age-gate */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var params = new URLSearchParams(window.location.search);
                  if (params.get('ageVerified') !== 'true') return;
                  localStorage.setItem('age-verified', 'true');
                  localStorage.setItem('age-verification-time', new Date().toISOString());
                  params.delete('ageVerified');
                  var query = params.toString();
                  var cleanUrl = window.location.pathname + (query ? ('?' + query) : '') + window.location.hash;
                  window.history.replaceState(null, '', cleanUrl);
                } catch (_) {
                  // Ignore storage/history issues in restrictive browsers.
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen" suppressHydrationWarning>
        <StorefrontProvider initialSettings={siteSettings}>
          <AgeVerificationProvider>
            <div id="app-root" className="min-h-screen flex flex-col">
              {/* Skip link — must be the FIRST focusable element in <body> */}
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <DemoBanner />
              <Header />
              <main
                id="main-content"
                data-testid="main-content"
                className="flex-1"
              >
                {children}
              </main>
              <Footer />
            </div>
          </AgeVerificationProvider>

          {/* Cart Drawer */}
          <CartDrawer />

          {/* Global modal/toast slots */}
          <div id="modal-root" />
          <div id="toast-root" />
          <ToastContainer />
        </StorefrontProvider>
      </body>
    </html>
  );
}