import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: PlanFeature[]
  featured?: boolean
  buttonText: string
  buttonVariant: 'default' | 'primary' | 'blue'
  href: string
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'For quick charts and trying out Glyph.',
    features: [
      { text: '5 charts', included: true },
      { text: 'Auto chart detection', included: true },
      { text: 'PNG export (1×)', included: true },
      { text: 'Glyph watermark on all exports', included: false },
      { text: 'Brand kit (colors & fonts)', included: false },
      { text: 'Social text overlay', included: false },
      { text: 'SVG export', included: false },
    ],
    buttonText: 'Start free',
    buttonVariant: 'default',
    href: '/signup?plan=free',
  },
  {
    name: 'Pro',
    price: '$1',
    period: '/month',
    description: 'For analysts and content teams who publish regularly.',
    features: [
      { text: '50 charts', included: true },
      { text: 'Auto chart detection', included: true },
      { text: 'PNG export (1× and 2×)', included: true },
      { text: 'No watermark', included: true },
      { text: 'Brand kit (colors & fonts)', included: true },
      { text: 'Social text overlay', included: true },
      { text: 'SVG export', included: true },
    ],
    featured: true,
    buttonText: 'Get Pro — $1/mo',
    buttonVariant: 'blue',
    href: '/signup?plan=pro',
  },
  {
    name: 'Business',
    price: '$5',
    period: '/month',
    description: 'For agencies and finance teams with multiple brands.',
    features: [
      { text: 'Unlimited charts', included: true },
      { text: 'Auto chart detection', included: true },
      { text: 'PNG export (1×, 2×, and 3×)', included: true },
      { text: 'No watermark', included: true },
      { text: 'Full brand kit (logo + colors + fonts)', included: true },
      { text: 'Social media templates', included: true },
      { text: '3 brand profiles', included: true },
    ],
    buttonText: 'Get Business — $5/mo',
    buttonVariant: 'primary',
    href: '/signup?plan=biz',
  },
]

export function PlanCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[860px] mx-auto px-6 pb-20">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            'bg-surface border-[1.5px] border-border rounded-lg p-7 flex flex-col gap-5 transition-transform hover:-translate-y-[3px]',
            plan.featured && 'border-blue shadow-[0_0_0_4px_var(--color-blue-bg)]'
          )}
        >
          {/* Plan name */}
          <p className="text-[13px] font-semibold tracking-[0.06em] uppercase text-muted">
            {plan.name}
          </p>

          {/* Price */}
          <div className="text-[40px] font-extrabold tracking-[-0.04em] leading-none">
            {plan.price}
            {plan.period && (
              <sub className="text-[14px] font-normal text-muted tracking-normal">
                {plan.period}
              </sub>
            )}
          </div>

          {/* Description */}
          <p className="text-[12px] text-muted leading-[1.6] font-mono">
            {plan.description}
          </p>

          {/* Features */}
          <div className="flex flex-col gap-2 flex-1">
            {plan.features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 text-[12px]',
                  feature.included ? 'text-text' : 'text-faint line-through'
                )}
              >
                <span
                  className={cn(
                    'w-[6px] h-[6px] rounded-full flex-shrink-0',
                    feature.included ? 'bg-blue' : 'bg-faint'
                  )}
                />
                {feature.text}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href={plan.href}
            className={cn(
              'w-full text-center font-sans text-[13px] font-medium py-2 px-4 rounded-[8px] border transition-all tracking-[0.01em]',
              plan.buttonVariant === 'default' &&
                'border-border-strong bg-transparent text-text hover:bg-bg hover:border-text',
              plan.buttonVariant === 'primary' &&
                'border-text bg-text text-white hover:bg-[#333] hover:border-[#333]',
              plan.buttonVariant === 'blue' &&
                'border-blue bg-blue text-white hover:bg-blue-dark hover:border-blue-dark'
            )}
          >
            {plan.buttonText}
          </Link>
        </div>
      ))}
    </div>
  )
}
