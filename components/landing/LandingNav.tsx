'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from './Logo'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className="sticky top-0 z-[100] flex items-center justify-between px-8 h-[56px]"
      style={{
        background: 'rgba(12,12,12,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.4)' : 'none',
        transition: 'box-shadow 0.25s',
      }}
    >
      <Logo size="md" />

      <div className="flex items-center gap-7">
        <Link href="#how" className="text-[13px] font-medium text-muted hover:text-text transition-colors">
          How it works
        </Link>
        <Link href="#pricing" className="text-[13px] font-medium text-muted hover:text-text transition-colors">
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-[13px] font-medium px-[14px] py-[7px] rounded-[7px] border border-border text-muted hover:text-text hover:border-border-strong transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="text-[13px] font-semibold px-4 py-[7px] rounded-[7px] bg-text text-bg hover:opacity-90 transition-colors"
        >
          Get started free
        </Link>
      </div>
    </nav>
  )
}
