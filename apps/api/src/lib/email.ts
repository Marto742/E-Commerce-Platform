import { Resend } from 'resend'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'

// Resend client — instantiated lazily so the app starts even without a key
// (email is optional until Phase 8 makes it required)
let _resend: Resend | null = null

function getResend(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY)
  }
  return _resend
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

// ─── Core send helper ─────────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text } = options

  try {
    const { error } = await getResend().emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      ...(text && { text }),
    })

    if (error) {
      logger.error('Resend API error', { error: error.message, subject, to })
      throw new Error(error.message)
    }

    logger.info('Email sent', { subject, to })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Failed to send email', { message, subject, to })
    throw err
  }
}

// ─── Guard — skip sending if no API key (dev/test) ───────────────────────────

export function canSendEmail(): boolean {
  return Boolean(env.RESEND_API_KEY)
}
