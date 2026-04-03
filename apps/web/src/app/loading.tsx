// Home page route-level loading skeleton
// Shown by Next.js during navigation to / before the page JS hydrates

function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-subtle via-background to-background py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <div className="h-7 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-14 w-3/4 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-11 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-11 w-40 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryGridSkeleton() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-muted">
              <div className="aspect-square rounded-t-xl bg-muted-foreground/10" />
              <div className="p-3">
                <div className="h-4 w-2/3 rounded bg-muted-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedProductsSkeleton() {
  return (
    <section className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border bg-card">
              <div className="aspect-square bg-muted" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-5 w-1/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomeLoading() {
  return (
    <main>
      <HeroSkeleton />
      <CategoryGridSkeleton />
      <FeaturedProductsSkeleton />
    </main>
  )
}
