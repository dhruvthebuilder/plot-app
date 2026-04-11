'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/plans'

interface Chart {
  id: string
  title: string | null
  chart_type: string | null
  config: Record<string, unknown> | null
  thumbnail_url: string | null
  updated_at: string
}

interface Profile {
  first_name: string | null
  company: string | null
}

interface Props {
  plan: PlanType
  profile: Profile | null
  charts: Chart[]
  chartCount: number
  chartLimit: number
  storageMb: number
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function ChartPreview({ color }: { color: string }) {
  const bars = [55, 80, 45, 95, 65, 78]
  return (
    <div className="h-[130px] bg-bg flex items-end justify-center px-4 pt-4 pb-2 gap-1.5">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ height: `${h}%`, background: color, opacity: i % 2 === 0 ? 0.55 : 1 }}
        />
      ))}
    </div>
  )
}

export function DashboardClient({ plan, profile, charts, chartCount, chartLimit, storageMb }: Props) {
  const router = useRouter()
  const remaining = chartLimit === Infinity ? Infinity : chartLimit - chartCount
  const storagePct = Math.min(Math.round((chartCount / Math.max(chartLimit === Infinity ? 500 : chartLimit, 1)) * 100), 100)

  // Pick a brand color from first chart's config, fall back to blue
  function getPrimaryColor(chart: Chart): string {
    try {
      const cfg = chart.config as { primaryColor?: string } | null
      return cfg?.primaryColor || '#1D6EE8'
    } catch {
      return '#1D6EE8'
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Nav showPlanBadge plan={plan} showBrandKit showNewChart />

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-[220px] min-w-[220px] bg-surface border-r border-border p-3.5 flex flex-col gap-1">
          {[
            { label: 'Charts', icon: '▦', active: true, href: '/dashboard' },
            { label: 'Brand kit', icon: '◈', active: false, href: '/settings' },
            { label: 'Account', icon: '♟', active: false, href: '/settings' },
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
              <div className="text-[10px] font-mono text-muted mb-1.5">Charts used</div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue rounded-full transition-all"
                  style={{ width: `${storagePct}%` }}
                />
              </div>
              <div className="text-[9px] font-mono text-faint mt-1">
                {chartCount} of {chartLimit === Infinity ? '∞' : chartLimit}
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-7 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold tracking-[-0.02em]">
                {profile?.first_name ? `${profile.first_name}'s charts` : 'Your charts'}
              </h1>
              {profile?.company && (
                <p className="font-mono text-[11px] text-muted mt-0.5">{profile.company}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-muted">
                {chartCount} of {chartLimit === Infinity ? '∞' : chartLimit} used
              </span>
              <Link
                href="/editor"
                className="text-[13px] font-medium px-4 py-2 bg-text text-white rounded-[8px] border border-text hover:bg-[#333] transition-all"
              >
                + New chart
              </Link>
            </div>
          </div>

          {/* Upgrade banner — free plan only, when close to limit */}
          {plan === 'free' && remaining <= 3 && (
            <div className="bg-text text-white rounded-lg p-5 flex items-center justify-between mb-6">
              <div>
                <div className="text-[14px] font-semibold">
                  {remaining <= 0 ? 'Chart limit reached' : `${remaining} chart${remaining === 1 ? '' : 's'} remaining on Free plan`}
                </div>
                <div className="text-[11px] text-[#AAA] font-mono mt-0.5">
                  Upgrade to Pro for $1/mo · 50 charts · no watermark · SVG export
                </div>
              </div>
              <Link
                href="/?plan=pro#pricing"
                className="text-[12px] font-medium px-3 py-1.5 bg-white text-text rounded-[6px] hover:bg-[#F0F0F0] transition-all flex-shrink-0 ml-4"
              >
                Upgrade →
              </Link>
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

            {/* Real charts */}
            {charts.map(chart => (
              <Link
                key={chart.id}
                href={`/editor?id=${chart.id}`}
                className="bg-surface border border-border rounded-lg overflow-hidden hover:border-blue hover:shadow-[0_4px_16px_rgba(29,110,232,0.08)] transition-all"
              >
                {chart.thumbnail_url ? (
                  <div className="h-[130px] bg-bg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={chart.thumbnail_url}
                      alt={chart.title || 'Chart'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <ChartPreview color={getPrimaryColor(chart)} />
                )}
                <div className="px-3.5 py-3 border-t border-border">
                  <div className="text-[13px] font-semibold mb-0.5 truncate">
                    {chart.title || 'Untitled chart'}
                  </div>
                  <div className="text-[10px] text-muted font-mono">
                    {chart.chart_type || 'Chart'} · Updated {timeAgo(chart.updated_at)}
                  </div>
                </div>
              </Link>
            ))}

            {/* Empty state — no charts yet */}
            {charts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="text-[40px] mb-4 opacity-20">▦</div>
                <div className="text-[15px] font-semibold mb-1">No charts yet</div>
                <div className="font-mono text-[12px] text-muted mb-5">
                  Create your first chart and it will appear here.
                </div>
                <Link
                  href="/editor"
                  className="text-[13px] font-medium px-4 py-2 bg-text text-white rounded-[8px] border border-text hover:bg-[#333] transition-all"
                >
                  + Create first chart
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
