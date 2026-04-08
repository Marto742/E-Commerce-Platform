import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Login' }

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams
  const forbiddenError = error === 'forbidden' ? 'Access denied. Admin accounts only.' : undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">ShopAdmin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>
        <LoginForm initialError={forbiddenError} />
      </div>
    </div>
  )
}
