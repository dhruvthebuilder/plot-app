import { LandingNav } from '@/components/landing/LandingNav'
import { Hero } from '@/components/landing/Hero'
import { ProofStrip } from '@/components/landing/ProofStrip'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { WhyPlot } from '@/components/landing/WhyPlot'
import { Pricing } from '@/components/landing/Pricing'
import { CtaBand } from '@/components/landing/CtaBand'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <LandingNav />
      <Hero />
      <ProofStrip />
      <HowItWorks />
      <hr className="border-none border-t border-border max-w-[1100px] mx-auto" />
      <WhyPlot />
      <hr className="border-none border-t border-border max-w-[1100px] mx-auto" />
      <Pricing />
      <CtaBand />
      <LandingFooter />
    </div>
  )
}
