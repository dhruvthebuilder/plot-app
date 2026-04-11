'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Logo } from '@/components/landing/Logo'
import { cn } from '@/lib/utils'

type Plan = 'free' | 'pro' | 'biz'
type Step = 1 | 2 | 3

const BRAND_COLORS = ['#1D6EE8', '#111111', '#F0A500', '#10B981', '#E24B4A', '#7C3AED', '#EC4899']

const FONT_PAIRS = [
  { id: 'syne-ibm', display: 'Syne', style: {}, pair: '+ IBM Plex Mono' },
  { id: 'instrument-space', display: 'Serif', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }, pair: '+ Space Grotesk' },
  { id: 'dmsans-jetbrains', display: 'DM Serif', style: { fontFamily: 'Georgia, serif' }, pair: '+ JetBrains Mono' },
  { id: 'syne-bold', display: 'SYNE BOLD', style: { letterSpacing: '0.06em', fontSize: '12px' }, pair: '+ IBM Plex Mono' },
]

function SignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedPlan = (searchParams.get('plan') || 'free') as Plan

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Step 2 fields
  const [brandColor, setBrandColor] = useState('#1D6EE8')
  const [fontPair, setFontPair] = useState('syne-ibm')
  const [industry, setIndustry] = useState('Finance & Investment')
  const [logoUploaded, setLogoUploaded] = useState(false)

  const planLabels = { free: 'Free plan', pro: 'Pro — $1/mo', biz: 'Business — $5/mo' }
  const planBadgeClass = {
    free: 'bg-[#F0F0F0] text-muted',
    pro: 'bg-amber-bg text-[#B07800]',
    biz: 'bg-blue-bg text-blue-dark',
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

  async function handleCompleteSetup() {
    setError('')
    setLoading(true)

    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // 2. Update profile with company + industry
    // The trigger creates the profile row automatically — we just update it
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company: companyName, industry })
      .eq('id', userId)

    if (profileError) {
      // Non-fatal — profile might not exist yet if trigger is slow
      console.warn('Profile update:', profileError.message)
    }

    // 3. Insert default brand kit
    const { error: brandError } = await supabase
      .from('brand_kits')
      .insert({
        user_id: userId,
        name: companyName || 'Default',
        primary_color: brandColor,
        font_pair: fontPair,
        is_default: true,
      })

    if (brandError) {
      console.warn('Brand kit insert:', brandError.message)
    }

    setLoading(false)
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-6">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-[480px] bg-surface border border-border rounded-[12px] overflow-hidden">

        {/* Step tabs */}
        <div className="flex border-b border-border">
          {(['01 Account', '02 Brand kit', '03 Done'] as const).map((label, i) => (
            <div
              key={label}
              className={cn(
                'flex-1 py-3 text-center text-[10px] font-mono border-b-2 transition-all',
                step === i + 1 ? 'text-blue border-blue' :
                step > i + 1 ? 'text-muted border-transparent' :
                'text-faint border-transparent'
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* ── Step 1 — Account ── */}
        {step === 1 && (
          <div className="p-7">
            <span className={cn('inline-block font-mono text-[11px] px-[10px] py-1 rounded-full mb-5', planBadgeClass[selectedPlan])}>
              {planLabels[selectedPlan]}
            </span>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] mb-1">Create your account</h2>
            <p className="font-mono text-[12px] text-muted mb-6">Takes 60 seconds. No card needed for free plan.</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">First name</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Dhruv"
                  className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Last name</label>
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="M R"
                  className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
              />
            </div>

            <div className="mb-3">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Company / Brand name</label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Aeon"
                className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (e.target.value.length >= 8) setPasswordError('') }}
                  placeholder="Min 8 characters"
                  className={cn(
                    'w-full text-[13px] px-3 py-[9px] pr-10 border rounded-[8px] bg-bg text-text outline-none transition-colors',
                    passwordError ? 'border-[#E24B4A]' : 'border-border focus:border-blue'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted hover:text-text transition-colors"
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
              {passwordError && <p className="font-mono text-[10px] text-[#E24B4A] mt-1">{passwordError}</p>}
            </div>

            {error && <p className="font-mono text-[11px] text-[#E24B4A] mb-3">{error}</p>}

            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              className="w-full py-[9px] px-4 bg-text text-white text-[13px] font-semibold rounded-[8px] border border-text hover:bg-[#333] transition-colors"
            >
              Continue →
            </button>

            <p className="text-center font-mono text-[11px] text-muted mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-text hover:text-blue transition-colors">Sign in</Link>
            </p>
          </div>
        )}

        {/* ── Step 2 — Brand kit ── */}
        {step === 2 && (
          <div className="p-7">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] mb-1">Build your brand kit</h2>
            <p className="font-mono text-[12px] text-muted mb-6">Your charts will automatically match your brand.</p>

            {/* Logo upload */}
            <div className="mb-5">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Brand logo (optional)</label>
              <div
                onClick={() => setLogoUploaded(true)}
                className={cn(
                  'border-2 border-dashed rounded-[8px] p-5 text-center cursor-pointer transition-colors',
                  logoUploaded ? 'border-green bg-green-bg' : 'border-border hover:border-blue-dark'
                )}
              >
                <div className="text-[18px] mb-1">{logoUploaded ? '✓' : '↑'}</div>
                <div className={cn('text-[11px] font-mono', logoUploaded ? 'text-green' : 'text-muted')}>
                  {logoUploaded ? 'logo.png uploaded' : 'Click to upload PNG or SVG · max 2MB'}
                </div>
              </div>
            </div>

            {/* Primary color */}
            <div className="mb-5">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Primary brand color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setBrandColor(c)}
                    className={cn('w-8 h-8 rounded-full border-2 transition-all', brandColor === c ? 'border-text scale-110' : 'border-transparent')}
                    style={{ background: c }}
                  />
                ))}
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                  or
                  <input
                    type="text"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-[80px] px-2 py-1 border border-border rounded-[4px] font-mono text-[11px] bg-bg outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Font pair */}
            <div className="mb-5">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Chart font style</label>
              <div className="grid grid-cols-2 gap-2">
                {FONT_PAIRS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontPair(f.id)}
                    className={cn(
                      'p-2.5 border rounded-[8px] text-center transition-all',
                      fontPair === f.id ? 'border-blue bg-blue-bg' : 'border-border hover:border-border-strong'
                    )}
                  >
                    <div className="text-[14px] font-semibold mb-0.5" style={f.style}>{f.display}</div>
                    <div className="font-mono text-[9px] text-muted">{f.pair}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div className="mb-5">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors cursor-pointer font-mono"
              >
                <option>Finance & Investment</option>
                <option>Marketing & Media</option>
                <option>Consulting</option>
                <option>Research</option>
                <option>E-commerce</option>
                <option>Other</option>
              </select>
            </div>

            {/* Brand preview */}
            <div className="bg-bg border border-border rounded-[8px] p-3 flex items-center gap-3 mb-6">
              <div
                className="w-11 h-11 rounded-[8px] flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                style={{ background: brandColor }}
              >
                {(companyName[0] || 'A').toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-bold">{companyName || 'Your brand'}</div>
                <div className="font-mono text-[10px] text-muted">Charts will carry this identity</div>
              </div>
            </div>

            {error && <p className="font-mono text-[11px] text-[#E24B4A] mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-[9px] px-4 border border-border-strong text-[13px] font-medium rounded-[8px] hover:border-text transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleCompleteSetup}
                disabled={loading}
                className="flex-[2] py-[9px] px-4 bg-text text-white text-[13px] font-semibold rounded-[8px] border border-text hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading ? 'Setting up…' : 'Complete setup →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 — Done ── */}
        {step === 3 && (
          <div className="p-7 text-center">
            <div className="w-14 h-14 bg-text rounded-full flex items-center justify-center text-white text-[24px] mx-auto mb-4">
              ✓
            </div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] mb-2">You&apos;re in.</h2>
            <p className="font-mono text-[12px] text-muted mb-6">
              Brand kit saved. Start making charts that look like yours.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-[9px] px-4 bg-text text-white text-[13px] font-semibold rounded-[8px] border border-text hover:bg-[#333] transition-colors"
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
