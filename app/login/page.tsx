'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { Logo } from '@/components/landing/Logo'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const tooManyAttempts = attempts >= 5

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tooManyAttempts) return

    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setAttempts(a => a + 1)
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(redirect)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-6">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-[480px] bg-surface border border-border rounded-[12px] p-8">
        <h1 className="text-[20px] font-bold tracking-[-0.02em] mb-1">Welcome back</h1>
        <p className="font-mono text-[12px] text-muted mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-[11px] text-muted font-medium">Password</label>
              <Link href="/forgot-password" className="font-mono text-[11px] text-muted hover:text-text transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full text-[13px] px-3 py-[9px] pr-10 border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted hover:text-text transition-colors"
              >
                {showPassword ? 'hide' : 'show'}
              </button>
            </div>
          </div>

          {tooManyAttempts ? (
            <p className="font-mono text-[11px] text-[#E24B4A]">
              Too many attempts. Please wait before trying again.
            </p>
          ) : error ? (
            <p className="font-mono text-[11px] text-[#E24B4A]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || tooManyAttempts}
            className="w-full mt-1 py-[9px] px-4 bg-text text-white text-[13px] font-semibold rounded-[8px] border border-text hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="mt-5 font-mono text-[12px] text-muted">
        No account?{' '}
        <Link href="/signup" className="text-text font-medium hover:text-blue transition-colors">
          Get started free →
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <LoginContent />
    </Suspense>
  )
}
