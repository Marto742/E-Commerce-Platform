import { NextResponse } from 'next/server'

export function POST() {
  const res = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001')
  )
  res.cookies.delete('access_token')
  return res
}
