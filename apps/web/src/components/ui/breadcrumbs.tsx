import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@repo/ui'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const all = [{ label: 'Home', href: '/' }, ...items]

  // JSON-LD BreadcrumbList for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: item.href }),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}
      >
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((item, index) => {
            const isLast = index === all.length - 1
            const isHome = index === 0

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
                )}

                {isLast ? (
                  <span
                    className="line-clamp-1 max-w-[200px] font-medium text-foreground"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href!}
                    className="flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    {isHome && <Home className="size-3.5 shrink-0" />}
                    <span className={cn(isHome && 'sr-only sm:not-sr-only')}>{item.label}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
