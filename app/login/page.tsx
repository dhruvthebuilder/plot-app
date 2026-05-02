'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { Logo } from '@/components/landing/Logo'
import { Eye, EyeOff } from 'lucide-react'

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

  function friendlyError(msg: string): string {
    if (!msg) return 'Something went wrong. Please try again.'
    if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('network')) {
      return 'Connection failed. Check your internet and try again.'
    }
    if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('email not confirmed')) {
      return 'Incorrect email or password.'
    }
    if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
      return 'Too many attempts. Please wait a moment and try again.'
    }
    if (msg.toLowerCase().includes('email not confirmed')) {
      return 'Please confirm your email before signing in.'
    }
    return msg
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tooManyAttempts) return

    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setAttempts(a => a + 1)
        setError(friendlyError(authError.message))
        setLoading(false)
        return
      }

      router.push(redirect)
    } catch {
      setAttempts(a => a + 1)
      setError('Connection failed. Check your internet and try again.')
      setLoading(false)
    }
  }

  const inputCls = 'w-full text-[13px] px-3 py-[10px] border border-border rounded-[8px] bg-surface text-text outline-none focus:border-blue transition-colors placeholder:text-faint'

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-8">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-[400px] bg-surface border border-border rounded-[14px] p-8">
        <h1 className="text-[20px] font-bold tracking-[-0.02em] mb-1">Welcome back</h1>
        <p className="font-mono text-[12px] text-muted mb-7">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-[10px] text-muted font-medium uppercase tracking-[0.06em]">Password</label>
              <Link href="/forgot-password" className="font-mono text-[10px] text-muted hover:text-text transition-colors">
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
                className={inputCls + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {(tooManyAttempts || error) && (
            <p className="font-mono text-[11px] text-red">
              {tooManyAttempts ? 'Too many attempts. Please wait before trying again.' : error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || tooManyAttempts}
            className="w-full mt-1 py-[10px] px-4 bg-text text-bg text-[13px] font-semibold rounded-[8px] hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
