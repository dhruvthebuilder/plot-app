'use client'

import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'

// Mock data — replace with Supabase queries once auth is wired
const MOCK_PLAN = 'pro' as 'free' | 'pro' | 'biz'
const MOCK_CHARTS = [
  { id: '1', name: 'Revenue Q1–Q4', type: 'Bar', updatedAt: '2h ago', color: '#1D6EE8' },
  { id: '2', name: 'User Growth 2024', type: 'Line', updatedAt: '1d ago', color: '#1D6EE8' },
  { id: '3', name: 'Market Share', type: 'Donut', updatedAt: '3d ago', color: '#1D6EE8' },
  { id: '4', name: 'EBITDA Breakdown', type: 'Bar', updatedAt: '5d ago', color: '#F0A500' },
]
const CHART_LIMIT = { free: 5, pro: 50, biz: Infinity }
const USED = MOCK_CHARTS.length

export default function DashboardPage() {
  const limit = CHART_LIMIT[MOCK_PLAN]
  const storagePct = 28

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Nav showPlanBadge plan={MOCK_PLAN} showBrandKit showNewChart />

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-[220px] min-w-[220px] bg-surface border-r border-border p-3.5 flex flex-col gap-1">
          {[
            { label: 'Charts', icon: '▦', active: true, href: '/dashboard' },
            { label: 'Brand kit', icon: '◈', href: '/settings' },
            { label: 'Account', icon: '♟', href: '/settings' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] font-medium transition-all',
                item.active ? 'bg-text text-white' : 'text-muted hover:bg-bg hover:text-text'
              )}
            >
              <span className="text-[14px] opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="mt-auto pt-3">
            <div className="bg-bg rounded-[8px] p-2.5">
              <div className="text-[10px] font-mono text-muted mb-1.5">Storage used</div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-blue rounded-full transition-all" style={{ width: `${storagePct}%` }} />
              </div>
              <div className="text-[9px] font-mono text-faint mt-1">4.2MB of 50MB</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-7 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[22px] font-bold tracking-[-0.02em]">Your charts</h1>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-muted">{USED} of {limit === Infinity ? '∞' : limit} used</span>
              <Link href="/editor" className="text-[13px] font-medium px-4 py-2 bg-text text-white rounded-[8px] border border-text hover:bg-[#333] transition-all">+ New chart</Link>
            </div>
          </div>

          {/* Upgrade banner — free plan only */}
          {MOCK_PLAN === 'free' && (
            <div className="bg-text text-white rounded-lg p-5 flex items-center justify-between mb-6">
              <div>
                <div className="text-[14px] font-semibold">{limit - USED} charts remaining on Free plan</div>
                <div className="text-[11px] text-[#AAA] font-mono mt-0.5">Upgrade to Pro for $1/mo · 50 charts · no watermark · SVG export</div>
              </div>
              <Link href="/pricing" className="text-[12px] font-medium px-3 py-1.5 bg-white text-text rounded-[6px] hover:bg-[#F0F0F0] transition-all flex-shrink-0">Upgrade</Link>
            </div>
          )}

          {/* Charts grid */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {/* New chart card */}
            <Link
              href="/editor"
              className="border-2 border-dashed border-border rounded-lg h-[210px] flex flex-col items-center justify-center gap-2 text-muted hover:border-blue hover:text-blue transition-all cursor-pointer"
            >
              <span className="text-[28px] font-light">+</span>
              <span className="text-[12px] font-medium">New chart</span>
            </Link>

            {/* Existing charts */}
            {MOCK_CHARTS.map(chart => (
              <Link
                key={chart.id}
                href={`/editor?id=${chart.id}`}
                className="bg-surface border border-border rounded-lg overflow-hidden hover:border-blue hover:shadow-[0_4px_16px_rgba(29,110,232,0.08)] transition-all"
              >
                <div className="h-[130px] bg-bg flex items-end justify-center px-4 pt-4 pb-2 gap-1.5">
                  {[55, 80, 45, 95, 65, 78].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{ height: `${h}%`, background: chart.color, opacity: i % 2 === 0 ? 0.6 : 1 }}
                    />
                  ))}
                </div>
                <div className="px-3.5 py-3 border-t border-border">
                  <div className="text-[13px] font-semibold mb-0.5">{chart.name}</div>
                  <div className="text-[10px] text-muted font-mono">{chart.type} · Updated {chart.updatedAt}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
