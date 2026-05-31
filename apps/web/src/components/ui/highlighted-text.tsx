import { Fragment } from 'react'
import { cn } from '@repo/ui'

// Sentinel markers the search API wraps around query matches.
// Keep in sync with apps/api/src/modules/search/search.service.ts
const HL_PRE = '[[hl]]'
const HL_POST = '[[/hl]]'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Captures each highlighted chunk (including the markers) so split() keeps them.
const SPLIT_RE = new RegExp(`(${escapeRegExp(HL_PRE)}[\\s\\S]*?${escapeRegExp(HL_POST)})`, 'g')

interface HighlightedTextProps {
  /** Text that may contain [[hl]]…[[/hl]] markers around matched terms */
  text: string
  className?: string
}

/**
 * Renders search highlight markers as <mark> elements. Content is rendered as
 * React text nodes (never dangerouslySetInnerHTML), so it is XSS-safe even
 * though Meilisearch does not escape the surrounding content.
 */
export function HighlightedText({ text, className }: HighlightedTextProps) {
  // Fast path: nothing to highlight
  if (!text.includes(HL_PRE)) return <>{text}</>

  const parts = text.split(SPLIT_RE)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith(HL_PRE) && part.endsWith(HL_POST)) {
          const inner = part.slice(HL_PRE.length, part.length - HL_POST.length)
          return (
            <mark
              key={i}
              className={cn('rounded-[2px] bg-primary/15 font-semibold text-inherit', className)}
            >
              {inner}
            </mark>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
