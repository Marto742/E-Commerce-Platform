import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@repo/ui'
import { CartProvider } from '@/store/cart'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawerProvider } from '@/components/cart/cart-drawer-context'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SessionProvider } from '@/components/providers/session-provider'
import { Devtools } from './devtools'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ShopName — Your one-stop shop',
    template: '%s | ShopName',
  },
  description:
    'Curated collections, unbeatable prices, and fast delivery — all in one place. Shop thousands of products across every category.',
  keywords: ['shop', 'ecommerce', 'products', 'deals', 'fast delivery'],
  authors: [{ name: 'ShopName' }],
  creator: 'ShopName',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'ShopName',
    title: 'ShopName — Your one-stop shop',
    description: 'Curated collections, unbeatable prices, and fast delivery — all in one place.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShopName',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopName — Your one-stop shop',
    description: 'Curated collections, unbeatable prices, and fast delivery — all in one place.',
    images: ['/og-image.png'],
    creator: '@shopname',
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
  alternates: {
    canonical: APP_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <QueryProvider>
            <CartProvider>
              <CartDrawerProvider>
                <Navbar />
                {children}
                <Footer />
                <CartDrawer />
              </CartDrawerProvider>
            </CartProvider>
            {process.env.NODE_ENV !== 'production' && <Devtools />}
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
