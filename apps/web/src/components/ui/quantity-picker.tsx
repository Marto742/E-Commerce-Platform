'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@repo/ui'

interface QuantityPickerProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  /** Debounce delay in ms for the onChange callback (default 0 — immediate). */
  debounce?: number
  size?: 'sm' | 'md'
  className?: string
}

export function QuantityPicker({
  value,
  onChange,
  min = 1,
  max = Infinity,
  disabled = false,
  debounce = 0,
  size = 'md',
  className,
}: QuantityPickerProps) {
  // Local display value so the input stays responsive while debounce is pending
  const [display, setDisplay] = useState(String(value))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync display when external value changes (e.g. after server sync)
  useEffect(() => {
    setDisplay(String(value))
  }, [value])

  function emit(next: number) {
    const clamped = Math.min(max, Math.max(min, next))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (debounce > 0) {
      debounceRef.current = setTimeout(() => onChange(clamped), debounce)
    } else {
      onChange(clamped)
    }
    return clamped
  }

  function handleDecrement() {
    const next = value - 1
    setDisplay(String(Math.max(min, next)))
    emit(next)
  }

  function handleIncrement() {
    const next = value + 1
    setDisplay(String(Math.min(max, next)))
    emit(next)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplay(e.target.value)
  }

  function handleInputBlur() {
    const parsed = parseInt(display, 10)
    if (isNaN(parsed)) {
      setDisplay(String(value))
      return
    }
    const clamped = emit(parsed)
    setDisplay(String(clamped))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      handleIncrement()
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      handleDecrement()
    }
  }

  const btnClass = cn(
    'flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40',
    size === 'sm' ? 'px-2 py-1' : 'px-3 py-2'
  )
  const inputClass = cn(
    'w-10 bg-transparent text-center font-medium tabular-nums focus:outline-none',
    size === 'sm' ? 'text-xs' : 'text-sm'
  )

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={btnClass}
        aria-label="Decrease quantity"
      >
        <Minus className={size === 'sm' ? 'size-3' : 'size-4'} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Quantity"
        className={inputClass}
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={btnClass}
        aria-label="Increase quantity"
      >
        <Plus className={size === 'sm' ? 'size-3' : 'size-4'} />
      </button>
    </div>
  )
}
