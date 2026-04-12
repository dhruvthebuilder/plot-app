'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/plans'

const BRAND_COLORS = ['#1D6EE8', '#111111', '#F0A500', '#10B981', '#E24B4A', '#7C3AED', '#EC4899']

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
  industry: string | null
  plan: string
}

interface BrandKit {
  id: string
  name: string
  primary_color: string
  font_pair: string
  logo_url: string | null
}

interface Props {
  plan: PlanType
  profile: Profile | null
  brandKit: BrandKit | null
  chartCount: number
  chartLimit: number
  storageMb: number
  email: string
}

const planBadgeClass: Record<PlanType, string> = {
  free: 'bg-[#F0F0F0] text-muted',
  pro: 'bg-amber-bg text-[#B07800]',
  biz: 'bg-blue-bg text-blue-dark',
}

const planLabel: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro — $1/month',
  biz: 'Business — $5/month',
}

export function SettingsClient({ plan, profile, brandKit, chartCount, chartLimit, storageMb, email }: Props) {
  const router = useRouter()

  // Profile state
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [industry, setIndustry] = useState(profile?.industry || 'Finance & Investment')

  // Brand kit state
  const [brandColor, setBrandColor] = useState(brandKit?.primary_color || '#1D6EE8')
  const [logoUploaded, setLogoUploaded] = useState(!!brandKit?.logo_url)

  // UI state
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [passwordSent, setPasswordSent] = useState(false)

  const chartUsePct = chartLimit === Infinity ? 0 : Math.round((chartCount / chartLimit) * 100)

  async function handleSave() {
    setSaving(true)
    setSaveState('idle')
    try {
      const [profileRes, brandRes] = await Promise.all([
        fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: firstName, last_name: lastName, company, industry }),
        }),
        brandKit
          ? fetch(`/api/brand-kits/${brandKit.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: company || 'Default', primary_color: brandColor }),
            })
          : Promise.resolve({ ok: true }),
      ])

      if (!profileRes.ok || !(brandRes as Response).ok) {
        setSaveState('error')
      } else {
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 1800)
        router.refresh()
      }
    } catch {
      setSaveState('error')
    }
    setSaving(false)
  }

  async function handlePasswordReset() {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    setPasswordSent(true)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="bg-surface border-b border-border h-[52px] flex items-center justify-between px-6 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[28px] h-[28px] bg-text rounded-[6px] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="8" width="3" height="7" fill="white" rx="1" />
              <rect x="6" y="4" width="3" height="11" fill="white" rx="1" />
              <rect x="11" y="1" width="3" height="14" fill="white" rx="1" />
              <circle cx="2.5" cy="7" r="1.5" fill="#1D6EE8" />
              <circle cx="7.5" cy="3" r="1.5" fill="#1D6EE8" />
              <circle cx="12.5" cy="0.5" r="1.5" fill="#1D6EE8" />
            </svg>
          </div>
          <span className="text-[16px] font-extrabold tracking-[-0.03em]">Plot</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-[13px] font-medium px-4 py-[7px] rounded-[8px] border border-border-strong text-text hover:bg-bg hover:border-text transition-all"
          >
            ← Dashboard
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'text-[13px] font-medium px-4 py-[7px] rounded-[8px] border transition-all',
              saveState === 'saved'
                ? 'border-green bg-green-bg text-green'
                : saveState === 'error'
                ? 'border-[#E24B4A] bg-[#FEF2F2] text-[#E24B4A]'
                : 'bg-text text-white border-text hover:bg-[#333]'
            )}
          >
            {saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Failed — try again' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </nav>

      <div className="flex-1 py-7 px-6 overflow-auto">
        <div className="max-w-[640px] mx-auto">
          <h1 className="text-[22px] font-bold tracking-[-0.02em] mb-6">Brand kit &amp; account</h1>

          {/* Brand identity */}
          <div className="bg-surface border border-border rounded-[12px] p-6 mb-4">
            <div className="text-[13px] font-bold mb-1">Brand identity</div>
            <div className="font-mono text-[11px] text-muted mb-[18px]">Applied automatically to every chart you create</div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Brand name</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Industry</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full font-mono text-[11px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors cursor-pointer"
                >
                  <option>Finance &amp; Investment</option>
                  <option>Marketing &amp; Media</option>
                  <option>Consulting</option>
                  <option>Research</option>
                  <option>E-commerce</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Primary color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      brandColor === c ? 'border-text scale-110' : 'border-transparent'
                    )}
                    style={{ background: c }}
                  />
                ))}
                <span className="font-mono text-[11px] text-muted">Hex</span>
                <input
                  type="text"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="w-[80px] px-2 py-1 border border-border rounded-[4px] font-mono text-[11px] bg-bg outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Logo</label>
              <div
                onClick={() => setLogoUploaded(true)}
                className={cn(
                  'border-2 border-dashed rounded-[8px] p-4 text-center cursor-pointer transition-colors',
                  logoUploaded ? 'border-green bg-green-bg' : 'border-border hover:border-blue-dark'
                )}
              >
                <div className="text-[18px] mb-1">{logoUploaded ? '✓' : '↑'}</div>
                <div className={cn('text-[10px] font-mono', logoUploaded ? 'text-green' : 'text-muted')}>
                  {logoUploaded ? 'Logo uploaded' : 'Upload PNG or SVG logo · max 2MB'}
                </div>
              </div>
            </div>

            {/* Brand preview */}
            <div className="bg-bg border border-border rounded-[8px] p-4 flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-[8px] flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                style={{ background: brandColor }}
              >
                {(company[0] || 'A').toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-bold">{company || 'Your brand'}</div>
                <div className="font-mono text-[11px] text-muted">
                  {industry} · {brandColor}
                </div>
              </div>
            </div>
          </div>

          {/* Current plan */}
          <div className="bg-surface border border-border rounded-[12px] p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[13px] font-bold mb-1">Current plan</div>
                <span className={cn('font-mono text-[11px] px-[10px] py-[3px] rounded-full', planBadgeClass[plan])}>
                  {planLabel[plan]}
                </span>
              </div>
              {plan !== 'biz' && (
                <Link
                  href="/?plan=biz#pricing"
                  className="text-[12px] font-medium text-blue hover:text-blue-dark transition-colors"
                >
                  Upgrade to Business →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-3 gap-[10px]">
              <div className="bg-bg rounded-[8px] p-3">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.08em] mb-1">Charts</div>
                <div className="text-[16px] font-bold mb-1.5">
                  {chartCount}{' '}
                  <span className="text-[12px] text-muted font-normal">
                    / {chartLimit === Infinity ? '∞' : chartLimit}
                  </span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue rounded-full" style={{ width: `${chartUsePct}%` }} />
                </div>
              </div>

              <div className="bg-bg rounded-[8px] p-3">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.08em] mb-1">Storage</div>
                <div className="text-[16px] font-bold mb-1.5">
                  — <span className="text-[12px] text-muted font-normal">/ {storageMb}MB</span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue rounded-full" style={{ width: '0%' }} />
                </div>
              </div>

              <div className="bg-bg rounded-[8px] p-3">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.08em] mb-1">Brand profiles</div>
                <div className="text-[16px] font-bold mb-1.5">
                  1{' '}
                  <span className="text-[12px] text-muted font-normal">
                    / {plan === 'free' ? '0' : plan === 'pro' ? '1' : '3'}
                  </span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="bg-surface border border-border rounded-[12px] p-6">
            <div className="text-[13px] font-bold mb-1">Account</div>
            <div className="font-mono text-[11px] text-muted mb-[18px]">Your personal details</div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">First name</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Last name</label>
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-mono text-[11px] text-muted font-medium mb-1.5">Email</label>
              <input
                value={email}
                disabled
                className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-muted cursor-not-allowed"
              />
            </div>

            {passwordSent ? (
              <p className="text-[12px] font-mono text-green mb-4">
                ✓ Check your inbox — reset link sent to {email}
              </p>
            ) : (
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[12px] text-muted hover:text-text transition-colors mb-4 block"
              >
                Change password →
              </button>
            )}

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[12px] font-mono text-muted hover:text-text transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
