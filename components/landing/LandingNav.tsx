'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from './Logo'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className="sticky top-0 z-[100] flex items-center justify-between px-8 h-[52px]"
      style={{
        background: 'rgba(250,250,250,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E4E4E4',
        boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
        transition: 'box-shadow 0.2s',
      }}
    >
      <Logo size="md" />

      <div className="flex items-center gap-6">
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
          className="text-[13px] font-medium px-[14px] py-[7px] rounded-[7px] border border-border-strong text-text hover:border-text transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="text-[13px] font-semibold px-4 py-[7px] rounded-[7px] bg-text text-white border border-text hover:bg-[#333] hover:border-[#333] transition-colors"
        >
          Get started free
        </Link>
      </div>
    </nav>
  )
}
