'use client'
import { useFadeUp } from '@/hooks/useFadeUp'
import { Palette, Zap, Share2, FileDown } from 'lucide-react'

const CARDS = [
  {
    icon: Palette,
    title: 'Your brand, not ours',
    desc: 'Set your brand colors, font pair, and logo once. Every chart you make carries your identity automatically — no manual styling each time.',
  },
  {
    icon: Zap,
    title: "Auto-detection that's actually smart",
    desc: 'Plot reads your data structure — date columns, percentages, OHLC, categories — and picks the right chart type before you do.',
  },
  {
    icon: Share2,
    title: 'Social-ready in one click',
    desc: 'Add a headline and source caption over your chart for LinkedIn, X, or Instagram posts. Finance teams use it for weekly insight drops.',
  },
  {
    icon: FileDown,
    title: "Export that doesn't disappoint",
    desc: 'PNG at up to 3× for print-quality output. Clean SVG for Figma and Illustrator. Not the blurry screenshots you get from spreadsheets.',
  },
]

export function WhyPlot() {
  const headRef = useFadeUp(0)
  const gridRef = useFadeUp(100)

  return (
    <section className="max-w-[1100px] mx-auto px-8 py-20">
      <div ref={headRef}>
        <div className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-muted mb-3">
          Why Plot
        </div>
        <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-0.03em] leading-[1.1]">
          Built for people who<br />care how things look.
        </h2>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 gap-4 mt-12">
        {CARDS.map(card => (
          <div key={card.title} className="bg-surface border border-border rounded-[12px] px-6 py-5 flex gap-4 hover:border-blue transition-colors group">
            <div className="w-9 h-9 flex-shrink-0 bg-blue-bg rounded-[8px] flex items-center justify-center">
              <card.icon className="w-4.5 h-4.5 text-blue" style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div className="text-[14px] font-semibold tracking-[-0.01em] mb-1.5">{card.title}</div>
              <div className="text-[12px] text-muted leading-[1.65]">{card.desc}</div>
            </div>
          </div>
        ))}

        {/* Wide accent card */}
        <div className="col-span-2 bg-surface-2 border border-border rounded-[12px] px-7 py-6 flex items-start gap-4">
          <div className="w-9 h-9 flex-shrink-0 bg-blue-bg rounded-[8px] flex items-center justify-center text-[16px] mt-0.5">
            🏦
          </div>
          <div>
            <div className="text-[14px] font-semibold tracking-[-0.01em] mb-1.5">
              Made for finance, works for everyone
            </div>
            <div className="text-[12px] text-muted leading-[1.65] max-w-[640px]">
              Plot was built by people who make financial charts for a living — analysts, investors, fund managers.
              The chart types, tick formatting (₹, $, %, 1K/1M), and data patterns it understands reflect that.
              If you&apos;ve ever spent 40 minutes reformatting an Excel chart for a deck, Plot is for you.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
