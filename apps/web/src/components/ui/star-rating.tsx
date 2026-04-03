import { Star } from 'lucide-react'
import { cn } from '@repo/ui'

interface StarRatingProps {
  rating: number | null
  max?: number
  size?: 'sm' | 'md'
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating,
  max = 5,
  size = 'sm',
  showValue = false,
  className,
}: StarRatingProps) {
  const value = rating ?? 0
  const starSize = size === 'sm' ? 'size-3' : 'size-4'

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = value >= i + 1
        const half = !filled && value > i && value < i + 1
        return (
          <span key={i} className="relative inline-block">
            {/* Background (empty) star */}
            <Star className={cn(starSize, 'text-muted-foreground/30')} />
            {/* Filled overlay — clip to fraction for partial fill */}
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${(value - i) * 100}%` }}
              >
                <Star className={cn(starSize, 'fill-warning text-warning')} />
              </span>
            )}
          </span>
        )
      })}
      {showValue && rating != null && (
        <span className="ml-1 text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
      )}
    </span>
  )
}
