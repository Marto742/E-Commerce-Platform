'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRegister = (name: any, options?: any) => any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyErrors = any

import { cn } from '@repo/ui'

interface AddressFormProps {
  prefix: string
  register: AnyRegister
  errors: AnyErrors
  required?: boolean
  disabled?: boolean
}

function getError(errors: AnyErrors, prefix: string, name: string): string | undefined {
  const parts = `${prefix}.${name}`.split('.')
  let cur = errors
  for (const p of parts) {
    if (!cur) return undefined
    cur = cur[p]
  }
  return cur?.message as string | undefined
}

interface FieldWrapProps {
  label: string
  error?: string
  isRequired?: boolean
  children: React.ReactNode
}

function FieldWrap({ label, error, isRequired, children }: FieldWrapProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-foreground">
        {label}
        {isRequired && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const inputCn = (error?: string) =>
  cn(
    'h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error && 'border-destructive focus:ring-destructive'
  )

export function AddressForm({ prefix, register, errors, required, disabled }: AddressFormProps) {
  const err = (name: string) => getError(errors, prefix, name)
  const f = (name: string) => `${prefix}.${name}`
  const req = required ? { required: 'Required' } : {}

  return (
    <div className="grid gap-4">
      <FieldWrap label="Address line 1" error={err('line1')} isRequired={required}>
        <input
          {...register(f('line1'), req)}
          placeholder="123 Main St"
          disabled={disabled}
          className={inputCn(err('line1'))}
        />
      </FieldWrap>

      <FieldWrap label="Address line 2" error={err('line2')}>
        <input
          {...register(f('line2'))}
          placeholder="Apt, suite, floor (optional)"
          disabled={disabled}
          className={inputCn(err('line2'))}
        />
      </FieldWrap>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="City" error={err('city')} isRequired={required}>
          <input
            {...register(f('city'), req)}
            placeholder="New York"
            disabled={disabled}
            className={inputCn(err('city'))}
          />
        </FieldWrap>

        <FieldWrap label="State / Province" error={err('state')} isRequired={required}>
          <input
            {...register(f('state'), req)}
            placeholder="NY"
            disabled={disabled}
            className={inputCn(err('state'))}
          />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Postal code" error={err('postalCode')} isRequired={required}>
          <input
            {...register(f('postalCode'), req)}
            placeholder="10001"
            disabled={disabled}
            className={inputCn(err('postalCode'))}
          />
        </FieldWrap>

        <FieldWrap label="Country" error={err('country')} isRequired={required}>
          <select
            {...register(f('country'), req)}
            disabled={disabled}
            className={cn(inputCn(err('country')), 'cursor-pointer')}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </FieldWrap>
      </div>
    </div>
  )
}
