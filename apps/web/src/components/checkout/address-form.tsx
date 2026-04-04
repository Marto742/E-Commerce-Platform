'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRegister = (name: any, options?: any) => any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyErrors = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWatch = (name: any) => any

import { cn } from '@repo/ui'

// ─── Postal code patterns (mirrors backend validation/schemas/payment.ts) ─────

const POSTAL_PATTERNS: Record<string, { pattern: RegExp; hint: string }> = {
  US: { pattern: /^\d{5}(-\d{4})?$/, hint: '12345 or 12345-6789' },
  CA: { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, hint: 'A1A 1A1' },
  GB: { pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, hint: 'SW1A 1AA' },
  AU: { pattern: /^\d{4}$/, hint: '2000' },
  DE: { pattern: /^\d{5}$/, hint: '10115' },
  FR: { pattern: /^\d{5}$/, hint: '75001' },
}

function validatePostalCode(value: string, country: string): true | string {
  if (!value.trim()) return 'Required'
  const entry = POSTAL_PATTERNS[country]
  if (!entry) return value.trim().length >= 2 ? true : 'Invalid postal code'
  if (!entry.pattern.test(value.trim())) {
    return `Invalid format for selected country (e.g. ${entry.hint})`
  }
  return true
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddressFormProps {
  prefix: string
  register: AnyRegister
  errors: AnyErrors
  watch: AnyWatch
  required?: boolean
  disabled?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function AddressForm({
  prefix,
  register,
  errors,
  watch,
  required,
  disabled,
}: AddressFormProps) {
  const err = (name: string) => getError(errors, prefix, name)
  const f = (name: string) => `${prefix}.${name}`
  const req = required ? 'Required' : false

  const selectedCountry: string = watch(f('country')) || 'US'
  const postalHint = POSTAL_PATTERNS[selectedCountry]?.hint

  return (
    <div className="grid gap-4">
      {/* Line 1 */}
      <FieldWrap label="Address line 1" error={err('line1')} isRequired={required}>
        <input
          {...register(f('line1'), {
            required: req,
            minLength: { value: 5, message: 'Must be at least 5 characters' },
            maxLength: { value: 255, message: 'Too long' },
            validate: (v: string) => v.trim().length > 0 || 'Address is required',
          })}
          placeholder="123 Main St"
          disabled={disabled}
          className={inputCn(err('line1'))}
        />
      </FieldWrap>

      {/* Line 2 */}
      <FieldWrap label="Address line 2" error={err('line2')}>
        <input
          {...register(f('line2'), {
            maxLength: { value: 255, message: 'Too long' },
          })}
          placeholder="Apt, suite, floor (optional)"
          disabled={disabled}
          className={inputCn(err('line2'))}
        />
      </FieldWrap>

      <div className="grid grid-cols-2 gap-4">
        {/* City */}
        <FieldWrap label="City" error={err('city')} isRequired={required}>
          <input
            {...register(f('city'), {
              required: req,
              minLength: { value: 2, message: 'Must be at least 2 characters' },
              maxLength: { value: 100, message: 'Too long' },
              pattern: {
                value: /^[\p{L}\s'\-.,]+$/u,
                message: 'Letters and spaces only',
              },
            })}
            placeholder="New York"
            disabled={disabled}
            className={inputCn(err('city'))}
          />
        </FieldWrap>

        {/* State */}
        <FieldWrap label="State / Province" error={err('state')} isRequired={required}>
          <input
            {...register(f('state'), {
              required: req,
              minLength: { value: 2, message: 'Must be at least 2 characters' },
              maxLength: { value: 100, message: 'Too long' },
            })}
            placeholder="NY"
            disabled={disabled}
            className={inputCn(err('state'))}
          />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Postal code */}
        <FieldWrap label="Postal code" error={err('postalCode')} isRequired={required}>
          <input
            {...register(f('postalCode'), {
              required: req,
              validate: (v: string) => validatePostalCode(v, selectedCountry),
            })}
            placeholder={postalHint ?? '10001'}
            disabled={disabled}
            className={inputCn(err('postalCode'))}
          />
        </FieldWrap>

        {/* Country */}
        <FieldWrap label="Country" error={err('country')} isRequired={required}>
          <select
            {...register(f('country'), { required: req })}
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
