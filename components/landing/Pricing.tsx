'use client'
import Link from 'next/link'
import { useFadeUp } from '@/hooks/useFadeUp'

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
      { label: 'Plot watermark on exports', included: false },
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
            className={`bg-surface rounded-[12px] p-7 flex flex-col gap-5 transition-transform hover:-translate-y-[3px] ${
              plan.featured
                ? 'border-[1.5px] border-blue shadow-[0_0_0_4px_var(--color-blue-bg)]'
                : 'border-[1.5px] border-border'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold tracking-[0.06em] uppercase text-muted">
                  {plan.name}
                </div>
                {'badge' in plan && plan.badge && (
                  <span className="font-mono text-[9px] bg-blue-bg text-blue-dark px-2 py-0.5 rounded-full font-medium">
                    {plan.badge}
                  </span>
                )}
              </div>
              <div className="text-[40px] font-extrabold tracking-[-0.04em] leading-none mt-2">
                {plan.price}
                {plan.sub && (
                  <sub className="text-[14px] font-normal text-muted tracking-normal align-baseline">
                    {plan.sub}
                  </sub>
                )}
              </div>
              <div className="font-mono text-[11px] text-muted leading-[1.6] mt-2">{plan.desc}</div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {plan.features.map(feat => (
                <div
                  key={feat.label}
                  className={`flex items-center gap-2 text-[12px] ${!feat.included ? 'text-faint line-through' : ''}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: feat.included ? '#1D6EE8' : '#C8C8C8' }}
                  />
                  {feat.label}
                </div>
              ))}
            </div>

            <Link
              href={plan.ctaHref}
              className={`block text-[13px] font-semibold px-4 py-[9px] rounded-[7px] text-center transition-colors ${
                plan.ctaStyle === 'blue'
                  ? 'bg-blue text-white border border-blue hover:bg-blue-dark hover:border-blue-dark'
                  : plan.ctaStyle === 'dark'
                  ? 'bg-text text-white border border-text hover:bg-[#333]'
                  : 'bg-transparent text-text border border-border-strong hover:border-text'
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
