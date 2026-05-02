'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/plans'
import { CheckoutButton } from '@/components/upgrade/CheckoutButton'
import { ArrowLeft, Upload, Check, Save } from 'lucide-react'

const BRAND_COLORS = ['#5B9CF6', '#EBEBEB', '#F5A623', '#34D399', '#F87171', '#A78BFA', '#EC4899']

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
  free: 'bg-surface-2 text-muted',
  pro: 'bg-amber-bg text-amber',
  biz: 'bg-blue-bg text-blue',
}

const planLabel: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro — $1/month',
  biz: 'Business — $5/month',
}

export function SettingsClient({ plan, profile, brandKit, chartCount, chartLimit, storageMb, email }: Props) {
  const router = useRouter()

  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [industry, setIndustry] = useState(profile?.industry || 'Finance & Investment')
  const [brandColor, setBrandColor] = useState(brandKit?.primary_color || '#5B9CF6')
  const [logoUploaded, setLogoUploaded] = useState(!!brandKit?.logo_url)
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

  const inputCls = 'w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors placeholder:text-muted'

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="bg-surface border-b border-border h-[52px] flex items-center justify-between px-5 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] bg-text rounded-[5px] flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <rect x="1" y="8" width="3" height="7" fill="var(--color-bg)" rx="1"/>
              <rect x="6" y="4" width="3" height="11" fill="var(--color-bg)" rx="1"/>
              <rect x="11" y="1" width="3" height="14" fill="var(--color-bg)" rx="1"/>
              <circle cx="2.5" cy="7" r="1.5" fill="var(--color-blue)"/>
              <circle cx="7.5" cy="3" r="1.5" fill="var(--color-blue)"/>
              <circle cx="12.5" cy="0.5" r="1.5" fill="var(--color-blue)"/>
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-[-0.03em] text-text">Plot</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-[7px] rounded-[8px] border border-border text-muted hover:text-text hover:border-border-strong transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-[7px] rounded-[8px] border transition-all disabled:opacity-50',
              saveState === 'saved'
                ? 'border-green bg-green-bg text-green'
                : saveState === 'error'
                ? 'border-red bg-red-bg text-red'
                : 'bg-text text-bg border-text hover:opacity-90'
            )}
          >
            {saveState === 'saved'
              ? <><Check className="w-3.5 h-3.5" /> Saved</>
              : saveState === 'error'
              ? 'Failed — retry'
              : saving
              ? 'Saving…'
              : <><Save className="w-3.5 h-3.5" /> Save changes</>
            }
          </button>
        </div>
      </nav>

      <div className="flex-1 py-8 px-6 overflow-auto">
        <div className="max-w-[640px] mx-auto">
          <h1 className="text-[20px] font-bold tracking-[-0.02em] mb-6">Brand kit &amp; account</h1>

          {/* Brand identity */}
          <div className="bg-surface border border-border rounded-[12px] p-6 mb-4">
            <div className="text-[13px] font-semibold mb-0.5">Brand identity</div>
            <div className="font-mono text-[11px] text-muted mb-5">Applied automatically to every chart you create</div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Brand name</label>
                <input value={company} onChange={e => setCompany(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Industry</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full font-mono text-[12px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors cursor-pointer"
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
              <label className="block font-mono text-[10px] text-muted font-medium mb-2 uppercase tracking-[0.06em]">Primary color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      brandColor === c ? 'border-text scale-110 shadow-[0_0_0_1px_var(--color-bg)]' : 'border-transparent hover:scale-105'
                    )}
                    style={{ background: c }}
                  />
                ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="font-mono text-[10px] text-muted">HEX</span>
                  <input
                    type="text"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-[88px] px-2 py-1.5 border border-border rounded-[6px] font-mono text-[11px] bg-bg text-text outline-none focus:border-blue transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-mono text-[10px] text-muted font-medium mb-2 uppercase tracking-[0.06em]">Logo</label>
              <div
                onClick={() => setLogoUploaded(true)}
                className={cn(
                  'border border-dashed rounded-[8px] p-5 text-center cursor-pointer transition-all',
                  logoUploaded
                    ? 'border-green bg-green-bg'
                    : 'border-border hover:border-blue hover:bg-blue-bg'
                )}
              >
                {logoUploaded
                  ? <Check className="w-5 h-5 text-green mx-auto mb-1" />
                  : <Upload className="w-5 h-5 text-muted mx-auto mb-1" />
                }
                <div className={cn('text-[11px] font-mono', logoUploaded ? 'text-green' : 'text-muted')}>
                  {logoUploaded ? 'Logo uploaded' : 'Click to upload PNG or SVG · max 2MB'}
                </div>
              </div>
            </div>

            {/* Brand preview */}
            <div className="bg-bg border border-border rounded-[8px] p-3.5 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                style={{ background: brandColor }}
              >
                {(company[0] || 'A').toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{company || 'Your brand'}</div>
                <div className="font-mono text-[10px] text-muted">{industry} · {brandColor}</div>
              </div>
            </div>
          </div>

          {/* Current plan */}
          <div className="bg-surface border border-border rounded-[12px] p-6 mb-4">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[13px] font-semibold mb-1.5">Current plan</div>
                <span className={cn('font-mono text-[10px] px-[10px] py-[3px] rounded-full font-medium', planBadgeClass[plan])}>
                  {planLabel[plan]}
                </span>
              </div>
              {plan === 'free' && (
                <CheckoutButton
                  plan="pro"
                  className="text-[12px] font-medium text-blue hover:text-blue-dark transition-colors bg-transparent border-none cursor-pointer"
                >
                  Upgrade to Pro →
                </CheckoutButton>
              )}
              {plan === 'pro' && (
                <CheckoutButton
                  plan="biz"
                  className="text-[12px] font-medium text-blue hover:text-blue-dark transition-colors bg-transparent border-none cursor-pointer"
                >
                  Upgrade to Business →
                </CheckoutButton>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Charts', value: chartCount, max: chartLimit === Infinity ? '∞' : chartLimit, pct: chartUsePct },
                { label: 'Storage', value: '—', max: `${storageMb}MB`, pct: 0 },
                { label: 'Brand profiles', value: 1, max: plan === 'free' ? 0 : plan === 'pro' ? 1 : 3, pct: 100 },
              ].map(stat => (
                <div key={stat.label} className="bg-bg rounded-[8px] p-3">
                  <div className="text-[9px] font-mono text-muted uppercase tracking-[0.08em] mb-1.5">{stat.label}</div>
                  <div className="text-[15px] font-bold mb-2">
                    {stat.value}{' '}
                    <span className="text-[11px] text-muted font-normal">/ {stat.max}</span>
                  </div>
                  <div className="h-[3px] bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-blue rounded-full" style={{ width: `${stat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="bg-surface border border-border rounded-[12px] p-6">
            <div className="text-[13px] font-semibold mb-0.5">Account</div>
            <div className="font-mono text-[11px] text-muted mb-5">Your personal details</div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">First name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Last name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-mono text-[10px] text-muted font-medium mb-1.5 uppercase tracking-[0.06em]">Email</label>
              <input
                value={email}
                disabled
                className="w-full text-[13px] px-3 py-[9px] border border-border rounded-[8px] bg-bg text-muted cursor-not-allowed"
              />
            </div>

            {passwordSent ? (
              <p className="text-[12px] font-mono text-green mb-4 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Reset link sent to {email}
              </p>
            ) : (
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[12px] text-muted hover:text-text transition-colors mb-5 block"
              >
                Change password →
              </button>
            )}

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[12px] font-mono text-muted hover:text-red transition-colors"
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
