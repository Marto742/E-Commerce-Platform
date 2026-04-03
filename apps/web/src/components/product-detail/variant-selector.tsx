'use client'

import { useEffect, useState } from 'react'
import { cn } from '@repo/ui'
import type { ProductVariant } from '@/types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedId: string | null
  onSelect: (variant: ProductVariant) => void
}

type AttributeSelection = Record<string, string>

// ─── Color map ────────────────────────────────────────────────────────────────
// Maps common color names (lowercase) to a CSS background value.

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
  white: '#ffffff',
  black: '#000000',
  gray: '#6b7280',
  grey: '#6b7280',
  silver: '#d1d5db',
  gold: '#d97706',
  brown: '#92400e',
  tan: '#d4a76a',
  navy: '#1e3a5f',
  beige: '#f5f0e8',
  cream: '#fffdd0',
  maroon: '#800000',
  olive: '#6b7c00',
  coral: '#ff6b6b',
  salmon: '#fa8072',
  khaki: '#c3b091',
  charcoal: '#374151',
}

function resolveColor(value: string): string | null {
  const lower = value.toLowerCase().trim()
  if (COLOR_MAP[lower]) return COLOR_MAP[lower]
  // Accept hex / rgb / hsl directly
  if (lower.startsWith('#') || lower.startsWith('rgb') || lower.startsWith('hsl')) return lower
  return null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns all distinct attribute keys that appear across variants. */
function getAttributeKeys(variants: ProductVariant[]): string[] {
  const keys = new Set<string>()
  for (const v of variants) {
    for (const k of Object.keys(v.attributes)) {
      keys.add(k)
    }
  }
  return Array.from(keys)
}

/** Returns distinct string values for a given attribute key. */
function getAttributeValues(variants: ProductVariant[], key: string): string[] {
  const seen = new Set<string>()
  const values: string[] = []
  for (const v of variants) {
    const val = v.attributes[key]
    if (typeof val === 'string' && !seen.has(val)) {
      seen.add(val)
      values.push(val)
    }
  }
  return values
}

/** Finds a variant whose attributes match every entry in `selection`. */
function resolveVariant(
  variants: ProductVariant[],
  selection: AttributeSelection,
  keys: string[]
): ProductVariant | null {
  if (keys.length === 0) return variants[0] ?? null
  return (
    variants.find((v) =>
      keys.every((k) => String(v.attributes[k] ?? '') === (selection[k] ?? ''))
    ) ?? null
  )
}

/**
 * Given a partial selection (all keys except `excludeKey`), returns whether
 * a particular value for `excludeKey` has any in-stock variant.
 */
function isValueAvailable(
  variants: ProductVariant[],
  keys: string[],
  selection: AttributeSelection,
  targetKey: string,
  targetValue: string
): boolean {
  return variants.some((v) => {
    if (String(v.attributes[targetKey] ?? '') !== targetValue) return false
    if (v.stock === 0) return false
    return keys
      .filter((k) => k !== targetKey)
      .every((k) => !selection[k] || String(v.attributes[k] ?? '') === selection[k])
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorSwatch({
  value,
  selected,
  available,
  onClick,
}: {
  value: string
  selected: boolean
  available: boolean
  onClick: () => void
}) {
  const css = resolveColor(value) ?? '#e5e7eb'
  const isLight =
    css === '#ffffff' ||
    css === '#fffdd0' ||
    css === '#f5f0e8' ||
    css === '#d1d5db' ||
    css === '#e5e7eb'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      title={value}
      aria-label={`${value}${!available ? ' — unavailable' : ''}`}
      aria-pressed={selected}
      className={cn(
        'relative size-8 rounded-full transition-all',
        selected ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-border hover:ring-primary/60',
        !available && 'cursor-not-allowed opacity-40'
      )}
      style={{ backgroundColor: css }}
    >
      {/* Diagonal slash for unavailable */}
      {!available && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'block h-px w-full rotate-45',
              isLight ? 'bg-foreground/40' : 'bg-background/60'
            )}
          />
        </span>
      )}
    </button>
  )
}

function PillButton({
  value,
  selected,
  available,
  onClick,
}: {
  value: string
  selected: boolean
  available: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      aria-pressed={selected}
      aria-label={`${value}${!available ? ' — unavailable' : ''}`}
      className={cn(
        'relative rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/60',
        !available && 'cursor-not-allowed opacity-40'
      )}
    >
      {value}
      {!available && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          <span className="absolute inset-x-0 top-1/2 block border-t border-muted-foreground/40" />
        </span>
      )}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
  const keys = getAttributeKeys(variants)

  // Initialise selection from the currently selected variant (if any)
  const initialSelection = (): AttributeSelection => {
    const v = variants.find((v) => v.id === selectedId)
    if (!v) return {}
    return Object.fromEntries(
      keys.map((k) => [k, typeof v.attributes[k] === 'string' ? String(v.attributes[k]) : ''])
    )
  }

  const [selection, setSelection] = useState<AttributeSelection>(initialSelection)

  // Keep selection in sync if selectedId changes externally
  useEffect(() => {
    setSelection(initialSelection())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // If there are no attribute keys, fall back to flat variant list by name
  if (keys.length === 0) {
    return <FlatVariantList variants={variants} selectedId={selectedId} onSelect={onSelect} />
  }

  function handlePick(key: string, value: string) {
    const next = { ...selection, [key]: value }
    setSelection(next)
    const resolved = resolveVariant(variants, next, keys)
    if (resolved) onSelect(resolved)
  }

  const selectedVariant = variants.find((v) => v.id === selectedId) ?? null

  return (
    <div className="flex flex-col gap-4">
      {keys.map((key) => {
        const values = getAttributeValues(variants, key)
        const isColor = key.toLowerCase() === 'color' || key.toLowerCase() === 'colour'
        const label = key.charAt(0).toUpperCase() + key.slice(1)
        const currentValue = selection[key]

        return (
          <div key={key} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {label}
              {currentValue && (
                <span className="ml-1.5 font-normal text-muted-foreground">{currentValue}</span>
              )}
            </p>

            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const available = isValueAvailable(variants, keys, selection, key, value)
                const selected = currentValue === value

                return isColor ? (
                  <ColorSwatch
                    key={value}
                    value={value}
                    selected={selected}
                    available={available}
                    onClick={() => handlePick(key, value)}
                  />
                ) : (
                  <PillButton
                    key={value}
                    value={value}
                    selected={selected}
                    available={available}
                    onClick={() => handlePick(key, value)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Selected variant summary */}
      {selectedVariant && (
        <p className="text-xs text-muted-foreground">
          SKU: <span className="font-mono">{selectedVariant.sku}</span>
        </p>
      )}
    </div>
  )
}

// ─── Fallback: no attributes, flat list ───────────────────────────────────────

function FlatVariantList({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariant[]
  selectedId: string | null
  onSelect: (v: ProductVariant) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">Option</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <PillButton
            key={v.id}
            value={v.name}
            selected={v.id === selectedId}
            available={v.stock > 0}
            onClick={() => v.stock > 0 && onSelect(v)}
          />
        ))}
      </div>
    </div>
  )
}
