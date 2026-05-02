'use client'
import { useFadeUp } from '@/hooks/useFadeUp'
import { ClipboardList, Sparkles, Download } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    icon: ClipboardList,
    title: 'Paste your data',
    desc: 'Drop in a CSV, paste from Excel, or type it manually. Plot reads the columns and understands what kind of data you have.',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'Plot picks the chart',
    desc: 'Time series becomes a line chart. Percentages become a donut. Financial data becomes candlestick. Auto-detected, always overridable.',
  },
  {
    num: '03',
    icon: Download,
    title: 'Export, instantly',
    desc: 'Download PNG at 1×, 2×, or 3× resolution. SVG for print. Add social media text overlays for LinkedIn and X — all in one click.',
  },
]

export function HowItWorks() {
  const headRef = useFadeUp(0)
  const gridRef = useFadeUp(100)

  return (
    <section id="how" className="max-w-[1100px] mx-auto px-8 py-20">
      <div ref={headRef}>
        <div className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-muted mb-3">
          How it works
        </div>
        <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-0.03em] leading-[1.1] mb-4">
          Three steps.<br />One beautiful chart.
        </h2>
        <p className="text-[16px] text-muted leading-[1.6] max-w-[480px]">
          No design tools. No formatting hell. Just data in, chart out — in your brand&apos;s colors and fonts.
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-3 gap-4 mt-12">
        {STEPS.map(step => (
          <div
            key={step.num}
            className="bg-surface border border-border rounded-[12px] p-6 relative overflow-hidden group hover:border-blue transition-colors"
          >
            <div className="font-mono text-[10px] font-medium text-faint tracking-[0.08em] mb-5">
              {step.num}
            </div>
            <div className="w-10 h-10 rounded-[9px] bg-blue-bg border border-blue/20 flex items-center justify-center mb-4">
              <step.icon className="w-5 h-5 text-blue" />
            </div>
            <div className="text-[15px] font-semibold tracking-[-0.01em] mb-2">{step.title}</div>
            <div className="text-[13px] text-muted leading-[1.65]">{step.desc}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        ))}
      </div>
    </section>
  )
}
