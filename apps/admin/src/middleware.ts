import { jwtVerify } from 'jose'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login']

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

function getSecret() {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Redirect authenticated users away from login
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token and enforce admin role for protected routes
  if (!isPublic && token) {
    try {
      const { payload } = await jwtVerify(token, getSecret())
      const role = payload['role'] as string | undefined

      if (!role || !ADMIN_ROLES.has(role)) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'forbidden')
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete('access_token')
        response.cookies.delete('refresh_token')
        return response
      }
    } catch {
      // Invalid or expired token — clear cookies and send to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
