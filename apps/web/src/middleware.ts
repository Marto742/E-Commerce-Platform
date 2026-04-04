import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ['/account', '/orders', '/checkout']

// Routes only accessible when NOT logged in
const AUTH_ONLY_PREFIXES = ['/auth/login', '/auth/register']

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isProtected = PROTECTED_PREFIXES.some((prefix) => nextUrl.pathname.startsWith(prefix))
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) => nextUrl.pathname.startsWith(prefix))

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthOnly && isLoggedIn) {
    return NextResponse.redirect(new URL('/', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
