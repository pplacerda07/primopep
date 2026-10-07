import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import { AnalyticsBootstrap } from '@/components/analytics-bootstrap'
import { MetaPixel } from '@/components/meta-pixel'
import { Providers } from '@/components/providers'
import { COPY } from '@/lib/content'
import { META_PIXEL_ID, SITE } from '@/lib/site'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  creator: SITE.name,
  publisher: SITE.name,
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1b1d20',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${fraunces.variable}`}
    >
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold-gradient focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-luxe-lg"
        >
          {COPY.common.skipToContent}
        </a>
        <Providers>{children}</Providers>
        <AnalyticsBootstrap />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && META_PIXEL_ID ? <MetaPixel id={META_PIXEL_ID} /> : null}
      </body>
    </html>
  )
}
