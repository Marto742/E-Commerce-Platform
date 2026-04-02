import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@repo/ui'
import { Devtools } from './devtools'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Admin — ShopName',
    template: '%s | Admin',
  },
  description: 'ShopName admin panel',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
          {process.env.NODE_ENV !== 'production' && <Devtools />}
        </QueryProvider>
      </body>
    </html>
  )
}
