import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-subtle via-background to-background py-20 sm:py-28 lg:py-36">
      {/* Background decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 size-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-primary" />
            New arrivals every week
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Discover Products <span className="text-primary">You&apos;ll Love</span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Curated collections, unbeatable prices, and fast delivery — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Shop Now
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/categories"
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Browse Categories
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {['🚚 Free shipping over $50', '↩️ 30-day returns', '🔒 Secure checkout'].map(
              (badge) => (
                <span key={badge} className="font-medium">
                  {badge}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
