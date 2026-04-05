import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { env } from '@/config/env'
import type { RegisterInput } from '@repo/validation'

const SALT_ROUNDS = 12

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

async function createRefreshToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } })

  return raw
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })
  if (existing) throw new AppError(409, 'CONFLICT', 'Email already registered')

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      avatarUrl: true,
    },
  })

  return user
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  // Constant-time comparison path — don't reveal whether email exists
  if (!user) {
    await bcrypt.hash(password, SALT_ROUNDS) // dummy work
    throw AppError.unauthorized('Invalid email or password')
  }

  if (user.status === 'SUSPENDED') {
    throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended')
  }
  if (user.status === 'DELETED') {
    await bcrypt.hash(password, SALT_ROUNDS) // dummy work
    throw AppError.unauthorized('Invalid email or password')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw AppError.unauthorized('Invalid email or password')

  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = await createRefreshToken(user.id)

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
    },
  }
}

// ─── OAuth login (Google / GitHub) ───────────────────────────────────────────

export async function oauthLogin(data: {
  provider: string
  providerId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
}) {
  // Find existing user by email or upsert
  let user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })

  if (!user) {
    // New OAuth user — store an uncrackable random placeholder as the password hash
    // so the NOT NULL constraint is satisfied. OAuth users use provider login only.
    const placeholderHash = `oauth:${crypto.randomBytes(32).toString('hex')}`

    user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: placeholderHash,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl ?? null,
        // Mark as ACTIVE immediately — OAuth provider already verified the email
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    })
  } else {
    // Existing user: update avatar if the OAuth provider has one and we don't
    if (data.avatarUrl && !user.avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: data.avatarUrl },
      })
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended')
    }
    if (user.status === 'DELETED') {
      throw AppError.unauthorized('Account not available')
    }
  }

  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = await createRefreshToken(user.id)

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
    },
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export async function refresh(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, role: true, status: true } } },
  })

  if (!stored || stored.expiresAt < new Date()) {
    throw AppError.unauthorized('Refresh token is expired or invalid')
  }
  if (stored.user.status === 'SUSPENDED') {
    throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended')
  }
  if (stored.user.status !== 'ACTIVE' && stored.user.status !== 'UNVERIFIED') {
    throw AppError.unauthorized('Refresh token is expired or invalid')
  }

  // Rotate: delete old token, issue new pair
  await prisma.refreshToken.delete({ where: { tokenHash } })
  const accessToken = signAccessToken(stored.user.id, stored.user.role)
  const newRefreshToken = await createRefreshToken(stored.user.id)

  return { accessToken, refreshToken: newRefreshToken }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  await prisma.refreshToken.deleteMany({ where: { tokenHash } })
}
