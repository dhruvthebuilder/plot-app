import Link from 'next/link'
import { Logo } from './Logo'

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-8 py-7 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Logo size="sm" showDots={false} />
        <span className="font-mono text-[10px] text-faint">© 2026</span>
      </div>
      <div className="flex gap-5">
        <Link href="/privacy" className="font-mono text-[11px] text-muted hover:text-text transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="font-mono text-[11px] text-muted hover:text-text transition-colors">
          Terms
        </Link>
        <Link href="mailto:hello@useglyph.in" className="font-mono text-[11px] text-muted hover:text-text transition-colors">
          Contact
        </Link>
      </div>
    </footer>
  )
}
