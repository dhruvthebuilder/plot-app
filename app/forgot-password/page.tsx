'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Logo } from '@/components/landing/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-6">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-[480px] bg-surface border border-border rounded-[12px] p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-bg border border-green rounded-full flex items-center justify-center text-green text-[20px] mx-auto mb-4">✓</div>
            <h1 className="text-[20px] font-bold tracking-[-0.02em] mb-2">Check your inbox</h1>
            <p className="font-mono text-[12px] text-muted">
              We sent a reset link to <strong className="text-text">{email}</strong>
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-[20px] font-bold tracking-[-0.02em] mb-1">Reset your password</h1>
            <p className="font-mono text-[12px] text-muted mb-6">
              Enter your email and we&apos;ll send a reset link.
            </p>

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

              {error && <p className="font-mono text-[11px] text-[#E24B4A]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-[9px] px-4 bg-text text-white text-[13px] font-semibold rounded-[8px] border border-text hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-5 font-mono text-[12px] text-muted">
        Remember it?{' '}
        <Link href="/login" className="text-text font-medium hover:text-blue transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
