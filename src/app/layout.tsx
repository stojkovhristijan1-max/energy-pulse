import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'energy.pulse - Professional Energy Market Intelligence',
  description: 'Next-generation energy market intelligence platform. AI-powered analysis of renewable energy transitions, commodity markets, and grid stability delivered via Telegram.',
  keywords: [
    'energy market analysis',
    'oil price predictions', 
    'natural gas forecasts',
    'energy stocks',
    'market intelligence',
    'AI trading signals',
    'energy news',
    'commodity trading',
    'market analysis',
    'energy insights'
  ],
  authors: [{ name: 'tcheevy.com', url: 'https://tcheevy.com' }],
  creator: 'tcheevy.com',
  publisher: 'tcheevy.com',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://energy-pulse.vercel.app',
    title: 'energy.pulse - Professional Energy Market Intelligence',
    description: 'Next-generation energy market intelligence platform delivering AI-powered insights for renewable energy transitions.',
    siteName: 'energy.pulse',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Energy Insights AI - Market Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'energy.pulse - Professional Energy Market Intelligence',
    description: 'Next-generation energy market intelligence platform delivering AI-powered insights for renewable energy transitions.',
    images: ['/og-image.jpg'],
    creator: '@tcheevy',
  },

  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: 'https://energy-pulse.vercel.app',
  },
  metadataBase: new URL('https://energy-pulse.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Additional meta tags for better SEO */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Energy Insights AI",
              "description": "AI-powered energy market analysis and predictions delivered via Telegram",
              "url": "https://energy-insights-ai.vercel.app",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "tcheevy.com",
                "url": "https://tcheevy.com"
              },
              "featureList": [
                "Real-time energy market analysis",
                "AI-powered price predictions",
                "Telegram delivery",
                "Market news monitoring",
                "Risk assessment"
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="root">
          {children}
        </div>
        
        {/* Analytics and tracking scripts would go here */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics or other analytics */}
            {/* <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script> */}
          </>
        )}
      </body>
    </html>
  );
}

