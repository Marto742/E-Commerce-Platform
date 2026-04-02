import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@repo/ui'
import { CartProvider } from '@/store/cart'
import { Devtools } from './devtools'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'ShopName',
    template: '%s | ShopName',
  },
  description: 'Your one-stop shop for everything.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <CartProvider>{children}</CartProvider>
          {process.env.NODE_ENV !== 'production' && <Devtools />}
        </QueryProvider>
      </body>
    </html>
  )
}
