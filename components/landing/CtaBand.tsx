'use client'
import Link from 'next/link'
import { useFadeUp } from '@/hooks/useFadeUp'

export function CtaBand() {
  const ref = useFadeUp(0)

  return (
    <div className="max-w-[1100px] mx-auto px-8 mb-20">
      <div ref={ref} className="bg-text rounded-[16px] px-12 py-14 flex items-center justify-between gap-10">
        <div>
          <div className="text-[clamp(24px,3vw,36px)] font-extrabold tracking-[-0.03em] text-white leading-[1.1]">
            Your first chart is free.<br />Takes 60 seconds.
          </div>
          <div className="font-mono text-[14px] text-white/50 mt-2">
            No card needed · No design skills required · Cancel anytime
          </div>
        </div>
        <div className="flex flex-col gap-2.5 items-end flex-shrink-0">
          <Link
            href="/signup"
            className="bg-white text-text border border-white text-[14px] font-semibold px-6 py-3 rounded-[8px] hover:bg-[#F0F0F0] transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            Get started free →
          </Link>
          <Link
            href="/signup?plan=pro"
            className="bg-transparent text-white/60 border border-white/20 text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:border-white/40 hover:text-white transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            Start Pro for $1/mo
          </Link>
        </div>
      </div>
    </div>
  )
}
