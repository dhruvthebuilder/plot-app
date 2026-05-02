'use client'
import Link from 'next/link'
import { useFadeUp } from '@/hooks/useFadeUp'

export function CtaBand() {
  const ref = useFadeUp(0)

  return (
    <div className="max-w-[1100px] mx-auto px-8 mb-20">
      <div
        ref={ref}
        className="rounded-[16px] px-12 py-14 flex items-center justify-between gap-10"
        style={{
          background: 'linear-gradient(135deg, var(--color-surface-2) 0%, var(--color-surface) 100%)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: '0 0 0 1px rgba(91,156,246,0.08) inset',
        }}
      >
        <div>
          <div className="text-[clamp(22px,3vw,34px)] font-extrabold tracking-[-0.03em] leading-[1.1]">
            Your first chart is free.<br />
            <span className="text-blue">Takes 60 seconds.</span>
          </div>
          <div className="font-mono text-[13px] text-muted mt-3">
            No card needed · No design skills required · Cancel anytime
          </div>
        </div>
        <div className="flex flex-col gap-2.5 items-end flex-shrink-0">
          <Link
            href="/signup"
            className="bg-text text-bg border border-text text-[14px] font-semibold px-6 py-3 rounded-[8px] hover:opacity-90 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            Get started free →
          </Link>
          <Link
            href="/signup?plan=pro"
            className="bg-blue-bg text-blue border border-blue/30 text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:border-blue hover:text-blue-dark transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            Start Pro for $1/mo
          </Link>
        </div>
      </div>
    </div>
  )
}
