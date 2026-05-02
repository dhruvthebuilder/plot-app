'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft, Palette, Save, Plus, Download } from 'lucide-react'

interface NavProps {
  showPlanBadge?: boolean
  plan?: 'free' | 'pro' | 'biz'
  showBrandKit?: boolean
  showNewChart?: boolean
  showDashboardBack?: boolean
  showSave?: boolean
  showExport?: boolean
  onSave?: () => void
  onExport?: () => void
  isSaving?: boolean
}

export function Nav({
  showPlanBadge = false,
  plan = 'free',
  showBrandKit = false,
  showNewChart = false,
  showDashboardBack = false,
  showSave = false,
  showExport = false,
  onSave,
  onExport,
  isSaving = false,
}: NavProps) {
  return (
    <nav className="bg-surface border-b border-border h-[52px] flex items-center justify-between px-5 sticky top-0 z-50 flex-shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 cursor-pointer">
        <div className="w-[26px] h-[26px] bg-text rounded-[5px] flex items-center justify-center flex-shrink-0">
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

      {/* Right side */}
      <div className="flex items-center gap-2">
        {showPlanBadge && (
          <span
            className={cn(
              'font-mono text-[10px] font-medium px-[9px] py-[3px] rounded-full tracking-[0.04em]',
              plan === 'free' && 'bg-surface-2 text-muted',
              plan === 'pro' && 'bg-amber-bg text-amber',
              plan === 'biz' && 'bg-blue-bg text-blue'
            )}
          >
            {plan === 'free' && 'Free'}
            {plan === 'pro' && 'Pro'}
            {plan === 'biz' && 'Business'}
          </span>
        )}

        {showDashboardBack && (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-[7px] rounded-[8px] border border-border text-muted hover:text-text hover:border-border-strong transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        )}

        {showBrandKit && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-[7px] rounded-[8px] border border-border text-muted hover:text-text hover:border-border-strong transition-all"
          >
            <Palette className="w-3.5 h-3.5" />
            Brand kit
          </Link>
        )}

        {showSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-[7px] rounded-[8px] border border-border text-muted hover:text-text hover:border-border-strong transition-all disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        )}

        {showNewChart && (
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-[7px] rounded-[8px] bg-text text-bg hover:opacity-90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New chart
          </Link>
        )}

        {showExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-[7px] rounded-[8px] bg-blue text-white hover:opacity-90 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        )}

        {!showPlanBadge && !showDashboardBack && !showNewChart && !showSave && !showExport && (
          <Link
            href="/signup"
            className="text-[13px] font-medium px-3 py-[7px] rounded-[8px] border border-border text-muted hover:text-text hover:border-border-strong transition-all"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
