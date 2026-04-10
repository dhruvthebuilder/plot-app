import { Nav } from '@/components/layout/Nav'
import { PricingHero } from '@/components/pricing/PricingHero'
import { PlanCards } from '@/components/pricing/PlanCards'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main>
        <PricingHero />
        <PlanCards />
        <p className="font-mono text-[9px] text-faint text-center pb-6">
          Storage: Free ~5MB · Pro ~50MB · Business ~500MB per user. Powered by Supabase.
        </p>
      </main>
    </div>
  )
}
