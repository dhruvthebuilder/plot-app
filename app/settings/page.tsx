'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'
import { PLAN_LIMITS } from '@/lib/plans'

const BRAND_COLORS = ['#1D6EE8', '#111111', '#F0A500', '#10B981', '#E24B4A', '#7C3AED', '#EC4899']

// Mock data — replace with Supabase queries once auth is wired
const MOCK_PLAN = 'pro' as 'free' | 'pro' | 'biz'
const MOCK_PROFILE = {
  firstName: 'Dhruv',
  lastName: 'M R',
  email: 'dhruv@aeon.co',
  brandName: 'Aeon',
  brandColor: '#1D6EE8',
  industry: 'Finance & Investment',
}

export default function SettingsPage() {
  const [firstName, setFirstName] = useState(MOCK_PROFILE.firstName)
  const [lastName, setLastName] = useState(MOCK_PROFILE.lastName)
  const [email] = useState(MOCK_PROFILE.email)
  const [brandName, setBrandName] = useState(MOCK_PROFILE.brandName)
  const [brandColor, setBrandColor] = useState(MOCK_PROFILE.brandColor)
  const [industry, setIndustry] = useState(MOCK_PROFILE.industry)
  const [logoUploaded, setLogoUploaded] = useState(false)

  const limits = PLAN_LIMITS[MOCK_PLAN]
  const usedCharts = 4
  const usedStorage = 4.2

  const planBadgeClass = {
    free: 'bg-[#F0F0F0] text-muted',
    pro: 'bg-amber-bg text-[#B07800]',
    biz: 'bg-blue-bg text-blue-dark',
  }
  const planLabel = {
    free: 'Free',
    pro: 'Pro',
    biz: 'Business',
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Nav showDashboardBack showSave />

      <div className="flex-1 py-7 px-6 overflow-auto">
        <div className="max-w-[640px] mx-auto flex flex-col gap-5">

          {/* Brand Identity Card */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-[16px] font-bold tracking-[-0.02em] mb-5">Brand identity</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-muted font-medium mb-1.5 font-mono">Brand name</label>
                <input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted font-medium mb-1.5 font-mono">Industry</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors cursor-pointer font-mono"
                >
                  <option>Finance & Investment</option>
                  <option>Marketing & Media</option>
                  <option>Consulting</option>
                  <option>Research</option>
                  <option>E-commerce</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Primary color */}
            <div className="mb-4">
              <label className="block text-[11px] text-muted font-medium mb-1.5 font-mono">Primary brand color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setBrandColor(c)}
                    className={cn('w-8 h-8 rounded-full border-2 transition-all', brandColor === c ? 'border-text scale-110' : 'border-transparent')}
                    style={{ background: c }}
                  />
                ))}
                <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono">
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

            {/* Logo upload */}
            <div className="mb-4">
              <label className="block text-[11px] text-muted font-medium mb-1.5 font-mono">Brand logo</label>
              <div
                onClick={() => setLogoUploaded(true)}
                className={cn(
                  'border-2 border-dashed rounded-[8px] p-4 text-center cursor-pointer transition-colors',
                  logoUploaded ? 'border-green bg-green-bg' : 'border-border hover:border-blue-dark'
                )}
              >
                <div className="text-[16px] mb-1">{logoUploaded ? '✓' : '↑'}</div>
                <div className={cn('text-[10px] font-mono', logoUploaded ? 'text-green' : 'text-muted')}>
                  {logoUploaded ? 'logo.png uploaded' : 'Click to upload PNG or SVG · max 2MB'}
                </div>
              </div>
            </div>

            {/* Brand preview */}
            <div className="bg-bg border border-border rounded-[8px] p-3 flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-[8px] flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                style={{ background: brandColor }}
              >
                {(brandName[0] || 'A').toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-bold">{brandName || 'Your brand'}</div>
                <div className="text-[10px] text-muted font-mono">{industry}</div>
              </div>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold tracking-[-0.02em]">Current plan</h2>
                <span className={cn('font-mono text-[11px] px-[10px] py-1 rounded-full', planBadgeClass[MOCK_PLAN])}>
                  {planLabel[MOCK_PLAN]}
                </span>
              </div>
              {MOCK_PLAN !== 'biz' && (
                <Link href="/pricing" className="text-[12px] font-medium text-blue hover:text-blue-dark transition-colors">
                  Upgrade to Business
                </Link>
              )}
            </div>

            {/* Limits grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-bg rounded-[8px] p-3">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.1em] mb-1.5">Charts</div>
                <div className="text-[16px] font-bold mb-1.5">{usedCharts} <span className="text-muted font-normal text-[12px]">/ {limits.charts === Infinity ? '∞' : limits.charts}</span></div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue rounded-full transition-all" style={{ width: `${limits.charts === Infinity ? 5 : (usedCharts / limits.charts) * 100}%` }} />
                </div>
              </div>

              <div className="bg-bg rounded-[8px] p-3">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.1em] mb-1.5">Storage</div>
                <div className="text-[16px] font-bold mb-1.5">{usedStorage}MB <span className="text-muted font-normal text-[12px]">/ {limits.storage_mb}MB</span></div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue rounded-full transition-all" style={{ width: `${(usedStorage / limits.storage_mb) * 100}%` }} />
                </div>
              </div>

              <div className="bg-bg rounded-[8px] p-3">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.1em] mb-1.5">Brand profiles</div>
                <div className="text-[16px] font-bold mb-1.5">1 <span className="text-muted font-normal text-[12px]">/ {limits.brand_profiles || 1}</span></div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue rounded-full transition-all" style={{ width: `${(1 / (limits.brand_profiles || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Account Card */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-[16px] font-bold tracking-[-0.02em] mb-5">Account</h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] text-muted font-medium mb-1.5 font-mono">First name</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted font-medium mb-1.5 font-mono">Last name</label>
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 border border-border rounded-[8px] bg-bg text-text outline-none focus:border-blue transition-colors"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] text-muted font-medium mb-1.5 font-mono">Email</label>
              <input
                value={email}
                disabled
                className="w-full text-[13px] px-3 py-2 border border-border rounded-[8px] bg-bg text-muted outline-none cursor-not-allowed"
              />
            </div>

            <button className="text-[12px] text-muted hover:text-text transition-colors">
              Change password
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
