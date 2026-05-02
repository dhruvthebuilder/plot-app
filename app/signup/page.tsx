'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Logo } from '@/components/landing/Logo'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Upload, Check, ArrowLeft, Mail } from 'lucide-react'

type Plan = 'free' | 'pro' | 'biz'
type Step = 1 | 2 | 3 | 'confirm'

const BRAND_COLORS = ['#5B9CF6', '#EBEBEB', '#F5A623', '#34D399', '#F87171', '#A78BFA', '#EC4899']

const FONT_PAIRS = [
  { id: 'inter-jetbrains', display: 'Inter', style: {}, pair: '+ JetBrains Mono' },
  { id: 'instrument-space', display: 'Serif', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }, pair: '+ Space Grotesk' },
  { id: 'dm-mono', display: 'DM Sans', style: { fontFamily: 'Georgia, serif' }, pair: '+ Fira Mono' },
  { id: 'syne-bold', display: 'DISPLAY', style: { letterSpacing: '0.06em', fontSize: '12px' }, pair: '+ JetBrains Mono' },
]

const inputCls = 'w-full text-[13px] px-3 py-[10px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors placeholder:text-faint'

function friendlyError(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.'
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('network')) {
    return 'Connection failed. Check your internet and try again.'
  }
  if (msg.toLowerCase().includes('user already registered') || msg.toLowerCase().includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (msg.toLowerCase().includes('invalid email')) return 'Please enter a valid email address.'
  if (msg.toLowerCase().includes('weak password') || msg.toLowerCase().includes('password should')) return 'Password is too weak. Use at least 8 characters.'
  if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  return msg
}

function SignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedPlan = (searchParams.get('plan') || 'free') as Plan

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [brandColor, setBrandColor] = useState('#5B9CF6')
  const [fontPair, setFontPair] = useState('inter-jetbrains')
  const [industry, setIndustry] = useState('Finance & Investment')
  const [logoUploaded, setLogoUploaded] = useState(false)

  // userId captured after signUp — used to create brand kit server-side
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  const planLabels = { free: 'Free plan', pro: 'Pro — $1/mo', biz: 'Business — $5/mo' }
  const planBadgeClass = {
    free: 'bg-surface-2 text-muted',
    pro: 'bg-amber-bg text-amber',
    biz: 'bg-blue-bg text-blue',
  }

  function validateStep1() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !companyName.trim()) {
      setError('All fields are required.')
      return false
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return false
    }
    setError('')
    setPasswordError('')
    return true
  }

  async function handleCreateAccount() {
    if (!validateStep1()) return
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName } },
      })

      if (signUpError) {
        setError(friendlyError(signUpError.message))
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        setError('Signup failed. Please try again.')
        setLoading(false)
        return
      }

      setPendingUserId(userId)

      // If no session, Supabase requires email confirmation
      if (!authData.session) {
        setStep('confirm')
        setLoading(false)
        return
      }

      // Session exists — proceed directly to brand kit step
      setStep(2)
    } catch {
      setError('Connection failed. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteSetup() {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          company: companyName,
          industry,
          brandColor,
          fontPair,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Setup failed. Please try again.')
        setLoading(false)
        return
      }

      setStep(3)
    } catch {
      setError('Connection failed. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = step === 'confirm' ? 1 : (step as number)

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-7">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-[460px] bg-surface border border-border rounded-[14px] overflow-hidden">

        {/* Step indicator */}
        <div className="flex border-b border-border">
          {(['01 Account', '02 Brand kit', '03 Done'] as const).map((label, i) => (
            <div
              key={label}
              className={cn(
                'flex-1 py-3 text-center text-[10px] font-mono border-b-2 transition-all',
                stepIndex === i + 1 ? 'text-blue border-blue' :
                  stepIndex > i + 1 ? 'text-muted border-transparent' :
                    'text-faint border-transparent'
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Step 1 — Account */}
        {step === 1 && (
          <div className="p-7">
            <span className={cn('inline-block font-mono text-[10px] px-[10px] py-1 rounded-full mb-5 font-medium', planBadgeClass[selectedPlan])}>
              {planLabels[selectedPlan]}
            </span>
            <h2 className="text-[19px] font-bold tracking-[-0.02em] mb-1">Create your account</h2>
            <p className="font-mono text-[11px] text-muted mb-6">Takes 60 seconds. No card needed for free plan.</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">First name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className={inputCls} />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Last name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className={inputCls} />
              </div>
            </div>

            <div className="mb-3">
              <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Work email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls} />
            </div>

            <div className="mb-3">
              <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Company / Brand</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp" className={inputCls} />
            </div>

            <div className="mb-6">
              <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (e.target.value.length >= 8) setPasswordError('') }}
                  placeholder="Min 8 characters"
                  className={cn(inputCls, 'pr-10', passwordError && 'border-red')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="font-mono text-[10px] text-red mt-1">{passwordError}</p>}
            </div>

            {error && <p className="font-mono text-[11px] text-red mb-3">{error}</p>}

            <button
              onClick={handleCreateAccount}
              disabled={loading}
              className="w-full py-[10px] px-4 bg-text text-bg text-[13px] font-semibold rounded-[8px] hover:opacity-90 transition-colors disabled:opacity-40"
            >
              {loading ? 'Creating account…' : 'Continue →'}
            </button>

            <p className="text-center font-mono text-[11px] text-muted mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-text hover:text-blue transition-colors">Sign in</Link>
            </p>
          </div>
        )}

        {/* Email confirmation screen */}
        {step === 'confirm' && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-blue-bg border border-blue/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Mail className="w-6 h-6 text-blue" />
            </div>
            <h2 className="text-[19px] font-bold tracking-[-0.02em] mb-2">Check your inbox</h2>
            <p className="font-mono text-[12px] text-muted mb-2">
              We sent a confirmation link to
            </p>
            <p className="font-mono text-[12px] text-text font-semibold mb-6">{email}</p>
            <p className="font-mono text-[11px] text-faint mb-7">
              Click the link in the email to verify your account, then come back to sign in.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-[10px] px-4 bg-text text-bg text-[13px] font-semibold rounded-[8px] hover:opacity-90 transition-colors"
            >
              Go to sign in →
            </Link>
            <p className="font-mono text-[10px] text-faint mt-4">
              Didn&apos;t receive it? Check spam or{' '}
              <button
                onClick={handleCreateAccount}
                className="text-muted hover:text-text transition-colors underline underline-offset-2"
              >
                resend
              </button>
            </p>
          </div>
        )}

        {/* Step 2 — Brand kit */}
        {step === 2 && (
          <div className="p-7">
            <h2 className="text-[19px] font-bold tracking-[-0.02em] mb-1">Build your brand kit</h2>
            <p className="font-mono text-[11px] text-muted mb-6">Your charts will automatically match your brand.</p>

            <div className="mb-5">
              <label className="block font-mono text-[10px] text-muted font-medium mb-2 uppercase tracking-[0.06em]">Logo (optional)</label>
              <div
                onClick={() => setLogoUploaded(true)}
                className={cn(
                  'border border-dashed rounded-[8px] p-4 text-center cursor-pointer transition-all',
                  logoUploaded ? 'border-green bg-green-bg' : 'border-border hover:border-blue hover:bg-blue-bg'
                )}
              >
                {logoUploaded
                  ? <Check className="w-5 h-5 text-green mx-auto mb-1" />
                  : <Upload className="w-5 h-5 text-muted mx-auto mb-1" />
                }
                <div className={cn('text-[11px] font-mono', logoUploaded ? 'text-green' : 'text-muted')}>
                  {logoUploaded ? 'logo.png uploaded' : 'Click to upload PNG or SVG · max 2MB'}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-mono text-[10px] text-muted font-medium mb-2 uppercase tracking-[0.06em]">Primary brand color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setBrandColor(c)}
                    className={cn('w-7 h-7 rounded-full border-2 transition-all', brandColor === c ? 'border-text scale-110' : 'border-transparent hover:scale-105')}
                    style={{ background: c }}
                  />
                ))}
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted ml-1">
                  HEX
                  <input
                    type="text"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-[84px] px-2 py-1.5 border border-border rounded-[6px] font-mono text-[11px] bg-bg text-text outline-none focus:border-blue transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-mono text-[10px] text-muted font-medium mb-2 uppercase tracking-[0.06em]">Chart font style</label>
              <div className="grid grid-cols-2 gap-2">
                {FONT_PAIRS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontPair(f.id)}
                    className={cn(
                      'p-3 border rounded-[8px] text-center transition-all',
                      fontPair === f.id ? 'border-blue bg-blue-bg' : 'border-border hover:border-border-strong'
                    )}
                  >
                    <div className="text-[14px] font-semibold mb-0.5" style={f.style}>{f.display}</div>
                    <div className="font-mono text-[9px] text-muted">{f.pair}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-mono text-[10px] text-muted font-medium mb-2 uppercase tracking-[0.06em]">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full font-mono text-[12px] px-3 py-[10px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors cursor-pointer"
              >
                <option>Finance &amp; Investment</option>
                <option>Marketing &amp; Media</option>
                <option>Consulting</option>
                <option>Research</option>
                <option>E-commerce</option>
                <option>Other</option>
              </select>
            </div>

            {/* Brand preview */}
            <div className="bg-bg border border-border rounded-[8px] p-3.5 flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                style={{ background: brandColor }}
              >
                {(companyName[0] || 'A').toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{companyName || 'Your brand'}</div>
                <div className="font-mono text-[10px] text-muted">Charts will carry this identity</div>
              </div>
            </div>

            {error && <p className="font-mono text-[11px] text-red mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-[10px] border border-border text-[13px] font-medium rounded-[8px] hover:border-border-strong text-muted hover:text-text transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                onClick={handleCompleteSetup}
                disabled={loading}
                className="flex-1 py-[10px] px-4 bg-text text-bg text-[13px] font-semibold rounded-[8px] hover:opacity-90 transition-colors disabled:opacity-40"
              >
                {loading ? 'Setting up…' : 'Complete setup →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-green-bg border border-green rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-6 h-6 text-green" />
            </div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] mb-2">You&apos;re in.</h2>
            <p className="font-mono text-[12px] text-muted mb-7">
              Brand kit saved. Start making charts that look like yours.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-[10px] px-4 bg-text text-bg text-[13px] font-semibold rounded-[8px] hover:opacity-90 transition-colors"
            >
              Go to dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <SignupContent />
    </Suspense>
  )
}
