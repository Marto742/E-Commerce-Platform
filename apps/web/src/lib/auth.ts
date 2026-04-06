import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'

const API_BASE = process.env.API_URL ?? 'http://localhost:4000/v1'

interface ApiUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  avatarUrl: string | null
}

interface LoginResponse {
  data: {
    accessToken: string
    refreshToken: string
    user: ApiUser
  }
}

interface RefreshResponse {
  data: {
    accessToken: string
    refreshToken: string
  }
}

// Decode a JWT payload without verifying (verification happens API-side)
function decodeTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString())
    return (payload.exp as number) * 1000 // convert to ms
  } catch {
    return 0
  }
}

async function exchangeOAuthToken(
  provider: string,
  providerId: string,
  profile: { email?: string | null; name?: string | null; image?: string | null }
) {
  const [firstName = '', ...rest] = (profile.name ?? '').split(' ')
  const lastName = rest.join(' ')

  const res = await fetch(`${API_BASE}/auth/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      providerId,
      email: profile.email,
      firstName: firstName || 'User',
      lastName,
      avatarUrl: profile.image ?? null,
    }),
  })

  if (!res.ok) return null

  const { data } = (await res.json()) as LoginResponse
  return data
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: refreshToken }),
  })

  if (!res.ok) return null

  const { data } = (await res.json()) as RefreshResponse
  return data
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!res.ok) return null

        const { data } = (await res.json()) as LoginResponse
        const { user, accessToken, refreshToken } = data

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatarUrl,
          accessToken,
          refreshToken,
          accessTokenExpires: decodeTokenExpiry(accessToken),
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // OAuth sign-in: exchange provider token for our own JWT pair
      if (account && account.provider !== 'credentials' && user) {
        const result = await exchangeOAuthToken(account.provider, account.providerAccountId, user)
        if (result) {
          return {
            ...token,
            id: result.user.id,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            status: result.user.status,
            avatarUrl: result.user.avatarUrl,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            accessTokenExpires: decodeTokenExpiry(result.accessToken),
          }
        }
        return { ...token, error: 'OAuthExchangeFailed' }
      }

      // Credentials sign-in: persist everything from authorize()
      if (user) {
        return {
          ...token,
          id: user.id,
          firstName: (user as { firstName?: string }).firstName,
          lastName: (user as { lastName?: string }).lastName,
          role: (user as { role?: string }).role,
          status: (user as { status?: string }).status,
          avatarUrl: (user as { avatarUrl?: string | null }).avatarUrl,
          accessToken: (user as { accessToken?: string }).accessToken,
          refreshToken: (user as { refreshToken?: string }).refreshToken,
          accessTokenExpires: (user as { accessTokenExpires?: number }).accessTokenExpires,
        }
      }

      // Access token still valid
      if (Date.now() < ((token.accessTokenExpires as number) ?? 0) - 60_000) {
        return token
      }

      // Access token expired — try to refresh
      const refreshed = await refreshAccessToken(token.refreshToken as string)
      if (!refreshed) {
        return { ...token, error: 'RefreshTokenExpired' }
      }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: decodeTokenExpiry(refreshed.accessToken),
        error: undefined,
      }
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          role: token.role as string,
          status: token.status as string,
          avatarUrl: token.avatarUrl as string | null,
        },
        accessToken: token.accessToken as string,
        error: token.error as string | undefined,
      }
    },
  },

  pages: {
    signIn: '/auth/login',
  },

  session: {
    strategy: 'jwt',
    // Match the API refresh token lifetime (7 days).
    // NextAuth will re-invoke the jwt callback before this expires,
    // giving the refresh flow a chance to rotate tokens.
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    // Roll the session cookie expiry forward on each active request.
    updateAge: 24 * 60 * 60, // 24 hours
  },
})
