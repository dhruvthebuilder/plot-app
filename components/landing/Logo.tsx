import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  showDots?: boolean
  href?: string
}

const sizes = {
  sm: { box: 'w-[22px] h-[22px] rounded-[4px]', icon: 'w-3 h-3', text: 'text-[12px]', gap: 'gap-1.5' },
  md: { box: 'w-[28px] h-[28px] rounded-[6px]', icon: 'w-4 h-4', text: 'text-[16px]', gap: 'gap-2' },
  lg: { box: 'w-[36px] h-[36px] rounded-[8px]', icon: 'w-5 h-5', text: 'text-[20px]', gap: 'gap-2.5' },
}

export function Logo({ size = 'md', showName = true, showDots = true, href = '/' }: LogoProps) {
  const s = sizes[size]
  return (
    <Link href={href} className={`flex items-center ${s.gap} no-underline`}>
      <div className={`${s.box} bg-text flex items-center justify-center flex-shrink-0`}>
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.icon}>
          <rect x="1" y="8" width="3" height="7" fill="white" rx="1"/>
          <rect x="6" y="4" width="3" height="11" fill="white" rx="1"/>
          <rect x="11" y="1" width="3" height="14" fill="white" rx="1"/>
          {showDots && (
            <>
              <circle cx="2.5" cy="7" r="1.5" fill="#1D6EE8"/>
              <circle cx="7.5" cy="3" r="1.5" fill="#1D6EE8"/>
              <circle cx="12.5" cy="0.5" r="1.5" fill="#1D6EE8"/>
            </>
          )}
        </svg>
      </div>
      {showName && (
        <span className={`${s.text} font-extrabold tracking-[-0.03em] text-text`}>Plot</span>
      )}
    </Link>
  )
}
