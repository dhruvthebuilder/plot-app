'use client'
import Link from 'next/link'
import { useFadeUp } from '@/hooks/useFadeUp'

const BARS = [
  { height: '52%', opacity: 1 },
  { height: '70%', opacity: 0.75 },
  { height: '44%', opacity: 0.6 },
  { height: '92%', opacity: 1 },
  { height: '65%', opacity: 0.7 },
  { height: '78%', opacity: 0.8 },
]
const BAR_LABELS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6']

export function Hero() {
  const leftRef = useFadeUp(0)
  const rightRef = useFadeUp(150)

  return (
    <section
      className="max-w-[1100px] mx-auto px-8 grid gap-[60px] items-center"
      style={{
        gridTemplateColumns: '1fr 1fr',
        paddingTop: 80,
        paddingBottom: 60,
        minHeight: 'calc(100vh - 52px)',
      }}
    >
      {/* Left */}
      <div ref={leftRef} className="flex flex-col gap-7">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-bg text-blue-dark font-mono text-[11px] font-medium px-3 py-[5px] rounded-full w-fit tracking-[0.04em]">
          <span className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse" />
          Built for finance teams &amp; analysts
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(40px,5vw,64px)] font-extrabold tracking-[-0.04em] leading-[1.02] text-text">
          Data that speaks.<br />
          <span className="text-blue">Charts that close.</span>
        </h1>

        {/* Subhead */}
        <p className="text-[17px] text-muted leading-[1.65] max-w-[420px]">
          Paste a CSV. Plot reads it, picks the right chart, and applies{' '}
          <strong className="text-text font-semibold">your brand</strong>{' '}
          automatically. Export PNG or SVG in seconds — ready for decks, reports, and social posts.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="text-[14px] font-semibold px-[22px] py-[11px] rounded-[8px] bg-text text-white border border-text hover:bg-[#333] transition-colors inline-flex items-center gap-2"
          >
            Start for free →
          </Link>
          <Link
            href="#how"
            className="text-[14px] font-semibold px-[22px] py-[11px] rounded-[8px] bg-transparent text-muted border border-border-strong hover:border-text hover:text-text transition-colors"
          >
            See how it works
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2.5">
          <div className="flex">
            {[
              { bg: '#1D6EE8', letter: 'D' },
              { bg: '#111', letter: 'R' },
              { bg: '#F0A500', letter: 'A' },
              { bg: '#10B981', letter: 'K' },
            ].map((face, i) => (
              <div
                key={i}
                className="w-[26px] h-[26px] rounded-full border-2 border-bg text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: face.bg, marginLeft: i === 0 ? 0 : -7 }}
              >
                {face.letter}
              </div>
            ))}
          </div>
          <span className="font-mono text-[11px] text-muted">
            <strong className="text-text">Finance teams</strong> saving 3+ hours a week on chart prep
          </span>
        </div>
      </div>

      {/* Right — Demo card */}
      <div ref={rightRef} className="relative">
        {/* Floating chips */}
        <div
          className="absolute -top-4 right-10 bg-surface border border-border rounded-[8px] px-3 py-2 font-mono text-[10px] text-text shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center gap-1.5 whitespace-nowrap z-10"
          style={{ animation: 'plotFloat 3s ease-in-out infinite' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          Auto-detected: Line chart
        </div>
        <div
          className="absolute bottom-[60px] -right-8 bg-surface border border-border rounded-[8px] px-3 py-2 font-mono text-[10px] text-text shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center gap-1.5 whitespace-nowrap z-10"
          style={{ animation: 'plotFloat 3s ease-in-out infinite', animationDelay: '1.5s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue" />
          Exported as PNG 2× ↓
        </div>

        {/* Chart card */}
        <div className="bg-surface border border-border rounded-[14px] p-6 shadow-[0_4px_40px_rgba(0,0,0,0.06)]">
          {/* Card header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[16px] font-bold tracking-[-0.02em]">Q1–Q4 Revenue 2024</div>
              <div className="font-mono text-[10px] text-muted mt-0.5">Aeon Capital · Internal data</div>
            </div>
            <div className="font-mono text-[10px] font-medium px-[10px] py-[5px] rounded-[5px] border border-border bg-bg text-muted flex items-center gap-1.5">
              ↓ PNG
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Total', value: '₹2.6Cr' },
              { label: 'Peak', value: '₹91L' },
              { label: 'Avg / mo', value: '₹54L' },
            ].map(s => (
              <div key={s.label} className="bg-bg rounded-[7px] px-3 py-[10px]">
                <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted mb-0.5">{s.label}</div>
                <div className="text-[17px] font-bold tracking-[-0.02em]">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="h-[200px] relative flex items-end gap-2 px-1">
            {/* Grid lines */}
            <div className="absolute left-0 right-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height: 'calc(100% - 24px)' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-full h-px bg-[#F0F0F0]" />
              ))}
            </div>
            {/* Bars */}
            {BARS.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-[4px]"
                  style={{ height: bar.height, background: '#1D6EE8', opacity: bar.opacity }}
                />
                <div className="font-mono text-[9px] text-muted">{BAR_LABELS[i]}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="font-mono text-[9px] text-faint">
              Made with <strong className="text-muted">Plot</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-[2px] bg-blue" />
              <span className="font-mono text-[9px] text-muted">Aeon Capital</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
