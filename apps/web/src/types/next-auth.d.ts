import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string
    error?: 'RefreshTokenExpired'
    user: {
      id: string
      firstName: string
      lastName: string
      role: string
      status: string
      avatarUrl: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    firstName: string
    lastName: string
    role: string
    status: string
    avatarUrl: string | null
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
  }
}
