import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <SearchX className="mb-6 size-16 text-muted-foreground/40" />
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="mb-8 max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <Link
          href="/products"
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse products
        </Link>
      </div>
    </main>
  )
}
