'use client'
import { useFadeUp } from '@/hooks/useFadeUp'

const CARDS = [
  {
    icon: '🎨',
    title: 'Your brand, not ours',
    desc: 'Set your brand colors, font pair, and logo once. Every chart you make carries your identity automatically — no manual styling each time.',
  },
  {
    icon: '⚡',
    title: "Auto-detection that's actually smart",
    desc: 'Plot reads your data structure — date columns, percentages, OHLC, categories — and picks the right chart type before you do.',
  },
  {
    icon: '📱',
    title: 'Social-ready in one click',
    desc: 'Add a headline and source caption over your chart for LinkedIn, X, or Instagram posts. Finance teams use it for weekly insight drops.',
  },
  {
    icon: '📐',
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
          <div key={card.title} className="bg-surface border border-border rounded-[12px] px-7 py-6 flex gap-4">
            <div className="w-9 h-9 flex-shrink-0 bg-blue-bg rounded-[8px] flex items-center justify-center text-[16px]">
              {card.icon}
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-[-0.01em] mb-1">{card.title}</div>
              <div className="text-[12px] text-muted leading-[1.6]">{card.desc}</div>
            </div>
          </div>
        ))}

        {/* Wide dark card */}
        <div className="col-span-2 bg-text border border-text rounded-[12px] px-7 py-6 flex items-center gap-4">
          <div className="w-9 h-9 flex-shrink-0 bg-white/10 rounded-[8px] flex items-center justify-center text-[16px]">
            🏦
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-[-0.01em] mb-1 text-white">
              Made for finance, works for everyone
            </div>
            <div className="text-[12px] text-white/60 leading-[1.6] max-w-[600px]">
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
