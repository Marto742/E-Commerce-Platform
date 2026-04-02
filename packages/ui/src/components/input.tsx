import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 py-1 text-xs',
        default: 'h-10 px-3 py-2',
        lg: 'h-11 px-4 py-2.5 text-base',
      },
      state: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive placeholder:text-destructive/50',
        success: 'border-success focus-visible:ring-success',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'default',
    },
  }
)

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label rendered above the input */
  label?: string
  /** Hint text rendered below the input */
  hint?: string
  /** Error message — also sets `state="error"` automatically */
  error?: string
  /** Leading icon or adornment inside the input */
  startAdornment?: React.ReactNode
  /** Trailing icon or adornment inside the input */
  endAdornment?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, size, state, label, hint, error, startAdornment, endAdornment, id, ...props },
    ref
  ) => {
    const inputId = id ?? React.useId()
    const hintId = (hint ?? error) ? `${inputId}-hint` : undefined
    const resolvedState = error ? 'error' : state

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        aria-describedby={hintId}
        aria-invalid={!!error}
        className={cn(
          inputVariants({ size, state: resolvedState }),
          (startAdornment || endAdornment) && 'relative',
          startAdornment && 'pl-9',
          endAdornment && 'pr-9',
          className
        )}
        {...props}
      />
    )

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}

        {startAdornment || endAdornment ? (
          <div className="relative">
            {startAdornment && (
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground [&_svg]:size-4">
                {startAdornment}
              </span>
            )}
            {inputEl}
            {endAdornment && (
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground [&_svg]:size-4">
                {endAdornment}
              </span>
            )}
          </div>
        ) : (
          inputEl
        )}

        {(hint ?? error) && (
          <p
            id={hintId}
            className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
