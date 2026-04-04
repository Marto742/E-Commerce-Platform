export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-5 w-48 animate-pulse rounded bg-muted" />
      <div className="mb-8 h-8 w-32 animate-pulse rounded bg-muted" />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4 lg:sticky lg:top-24">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="size-14 shrink-0 animate-pulse rounded-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
          <div className="border-t pt-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
