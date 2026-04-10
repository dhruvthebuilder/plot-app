'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

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
    <nav className="bg-surface border-b border-border h-[52px] flex items-center justify-between px-6 sticky top-0 z-50 flex-shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-[7px] cursor-pointer">
        <div className="w-2 h-2 bg-blue rounded-full" />
        <span className="text-[16px] font-extrabold tracking-[-0.03em]">Plot</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-[10px]">
        {showPlanBadge && (
          <span
            className={cn(
              'font-mono text-[10px] font-medium px-[9px] py-[3px] rounded-full tracking-[0.04em]',
              plan === 'free' && 'bg-[#F0F0F0] text-muted',
              plan === 'pro' && 'bg-amber-bg text-[#B07800]',
              plan === 'biz' && 'bg-blue-bg text-blue-dark'
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
            className="font-sans text-[13px] font-medium px-4 py-2 rounded-[8px] border border-border-strong bg-transparent text-text hover:bg-bg hover:border-text transition-all tracking-[0.01em]"
          >
            ← Dashboard
          </Link>
        )}

        {showBrandKit && (
          <Link
            href="/settings"
            className="font-sans text-[13px] font-medium px-4 py-2 rounded-[8px] border border-border-strong bg-transparent text-text hover:bg-bg hover:border-text transition-all tracking-[0.01em]"
          >
            Brand kit
          </Link>
        )}

        {showSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="font-sans text-[13px] font-medium px-4 py-2 rounded-[8px] border border-border-strong bg-transparent text-text hover:bg-bg hover:border-text transition-all tracking-[0.01em] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}

        {showNewChart && (
          <Link
            href="/editor"
            className="font-sans text-[13px] font-medium px-4 py-2 rounded-[8px] border border-text bg-text text-white hover:bg-[#333] hover:border-[#333] transition-all tracking-[0.01em]"
          >
            + New chart
          </Link>
        )}

        {showExport && (
          <button
            onClick={onExport}
            className="font-sans text-[13px] font-medium px-4 py-2 rounded-[8px] border border-text bg-text text-white hover:bg-[#333] hover:border-[#333] transition-all tracking-[0.01em]"
          >
            ↓ Export
          </button>
        )}

        {/* Sign in button on landing page */}
        {!showPlanBadge && !showDashboardBack && !showNewChart && !showSave && !showExport && (
          <Link
            href="/signup"
            className="font-sans text-[13px] font-medium px-4 py-2 rounded-[8px] border border-border-strong bg-transparent text-text hover:bg-bg hover:border-text transition-all tracking-[0.01em]"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
