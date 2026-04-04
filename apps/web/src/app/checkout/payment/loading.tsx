export default function PaymentLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-5 w-48 animate-pulse rounded bg-muted" />
      <div className="mb-8 h-8 w-28 animate-pulse rounded bg-muted" />

      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          {/* Tab placeholders */}
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          </div>
          {/* Card fields */}
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </main>
  )
}
