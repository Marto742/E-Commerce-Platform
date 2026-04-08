'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'

interface LoginResponse {
  data: {
    accessToken: string
    refreshToken: string
    user: { role: string }
  }
}

export async function loginAction(_prevState: string | null, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  let result: LoginResponse
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      return json.error?.message ?? 'Invalid email or password'
    }

    result = (await res.json()) as LoginResponse
  } catch {
    return 'Could not reach the server. Try again.'
  }

  if (result.data.user.role.toLowerCase() !== 'admin') {
    return 'Access denied. Admin accounts only.'
  }

  const cookieStore = await cookies()
  cookieStore.set('access_token', result.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 min — refreshed server-side later
  })
  cookieStore.set('refresh_token', result.data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  redirect('/dashboard')
}
