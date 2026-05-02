'use client'
import Link from 'next/link'
import { useFadeUp } from '@/hooks/useFadeUp'
import { Check, Minus } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    sub: null,
    desc: 'For individuals exploring Plot.',
    features: [
      { label: '5 charts', included: true },
      { label: 'Auto chart detection', included: true },
      { label: 'PNG export (1×)', included: true },
      { label: 'No watermark', included: false },
      { label: 'Brand kit', included: false },
      { label: 'Social overlay', included: false },
      { label: 'SVG export', included: false },
    ],
    cta: 'Start free',
    ctaHref: '/signup?plan=free',
    ctaStyle: 'default',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$1',
    sub: '/month',
    desc: 'For analysts who publish regularly.',
    badge: 'Most popular',
    features: [
      { label: '50 charts', included: true },
      { label: 'Auto chart detection', included: true },
      { label: 'PNG export (1× and 2×)', included: true },
      { label: 'No watermark', included: true },
      { label: 'Brand colors & fonts', included: true },
      { label: 'Social text overlay', included: true },
      { label: 'SVG export', included: true },
    ],
    cta: 'Get Pro — $1/mo',
    ctaHref: '/signup?plan=pro',
    ctaStyle: 'blue',
    featured: true,
  },
  {
    name: 'Business',
    price: '$5',
    sub: '/month',
    desc: 'For agencies with multiple brands.',
    features: [
      { label: 'Unlimited charts', included: true },
      { label: 'Auto chart detection', included: true },
      { label: 'PNG export (1×, 2×, 3×)', included: true },
      { label: 'No watermark', included: true },
      { label: 'Full brand kit with logo', included: true },
      { label: 'Social media templates', included: true },
      { label: '3 brand profiles', included: true },
    ],
    cta: 'Get Business — $5/mo',
    ctaHref: '/signup?plan=biz',
    ctaStyle: 'dark',
    featured: false,
  },
]

export function Pricing() {
  const headRef = useFadeUp(0)
  const gridRef = useFadeUp(100)

  return (
    <section id="pricing" className="max-w-[1100px] mx-auto px-8 py-20">
      <div ref={headRef}>
        <div className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-muted mb-3">
          Pricing
        </div>
        <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-0.03em] leading-[1.1] mb-4">
          Start free.<br />Scale when you need to.
        </h2>
        <p className="text-[16px] text-muted leading-[1.6] max-w-[480px]">
          No trial periods. No credit card for free plan. Upgrade when Plot earns it.
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-3 gap-4 mt-12">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`rounded-[12px] p-7 flex flex-col gap-5 transition-all hover:-translate-y-1 ${
              plan.featured
                ? 'bg-surface border border-blue shadow-[0_0_0_3px_var(--color-blue-bg),0_8px_32px_rgba(91,156,246,0.12)]'
                : 'bg-surface border border-border hover:border-border-strong'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted">
                  {plan.name}
                </div>
                {'badge' in plan && plan.badge && (
                  <span className="font-mono text-[9px] bg-blue-bg text-blue px-2 py-0.5 rounded-full font-medium">
                    {plan.badge}
                  </span>
                )}
              </div>
              <div className="text-[42px] font-extrabold tracking-[-0.04em] leading-none mt-3">
                {plan.price}
                {plan.sub && (
                  <sub className="text-[14px] font-normal text-muted tracking-normal align-baseline ml-0.5">
                    {plan.sub}
                  </sub>
                )}
              </div>
              <div className="font-mono text-[11px] text-muted leading-[1.6] mt-2">{plan.desc}</div>
            </div>

            <div className="flex flex-col gap-[10px] flex-1">
              {plan.features.map(feat => (
                <div
                  key={feat.label}
                  className={`flex items-center gap-2.5 text-[12px] ${feat.included ? 'text-text' : 'text-faint'}`}
                >
                  {feat.included
                    ? <Check className="w-3.5 h-3.5 text-green flex-shrink-0" />
                    : <Minus className="w-3.5 h-3.5 text-faint flex-shrink-0" />
                  }
                  <span className={feat.included ? '' : 'line-through'}>{feat.label}</span>
                </div>
              ))}
            </div>

            <Link
              href={plan.ctaHref}
              className={`block text-[13px] font-semibold px-4 py-[10px] rounded-[8px] text-center transition-all ${
                plan.ctaStyle === 'blue'
                  ? 'bg-blue text-white hover:opacity-90'
                  : plan.ctaStyle === 'dark'
                  ? 'bg-text text-bg hover:opacity-90'
                  : 'bg-surface-2 text-text border border-border hover:border-border-strong'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="font-mono text-[9px] text-faint text-center mt-5">
        Storage: Free ~5MB · Pro ~50MB · Business ~500MB per user. Powered by Supabase.
      </p>
    </section>
  )
}
