'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/plans'
import { CheckoutButton } from '@/components/upgrade/CheckoutButton'
import { BarChart2, Palette, User, Plus, Zap } from 'lucide-react'

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
          className="flex-1 rounded-t-[3px]"
          style={{ height: `${h}%`, background: color, opacity: i % 2 === 0 ? 0.5 : 1 }}
        />
      ))}
    </div>
  )
}

export function DashboardClient({ plan, profile, charts, chartCount, chartLimit, storageMb }: Props) {
  const router = useRouter()
  const remaining = chartLimit === Infinity ? Infinity : chartLimit - chartCount
  const storagePct = Math.min(Math.round((chartCount / Math.max(chartLimit === Infinity ? 500 : chartLimit, 1)) * 100), 100)

  function getPrimaryColor(chart: Chart): string {
    try {
      const cfg = chart.config as { primaryColor?: string } | null
      return cfg?.primaryColor || 'var(--color-blue)'
    } catch {
      return 'var(--color-blue)'
    }
  }

  const navItems = [
    { label: 'Charts', icon: BarChart2, active: true, href: '/dashboard' },
    { label: 'Brand kit', icon: Palette, active: false, href: '/settings' },
    { label: 'Account', icon: User, active: false, href: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Nav showPlanBadge plan={plan} showBrandKit showNewChart />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[212px] min-w-[212px] bg-surface border-r border-border p-3 flex flex-col gap-0.5">
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[9px] rounded-[8px] text-[13px] font-medium transition-all',
                item.active
                  ? 'bg-surface-2 text-text'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              <item.icon className={cn('w-4 h-4', item.active ? 'text-blue' : 'text-muted')} />
              {item.label}
            </Link>
          ))}

          <div className="mt-auto pt-4">
            <div className="rounded-[8px] p-3 border border-border bg-bg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-mono text-muted">Charts used</div>
                <div className="text-[10px] font-mono text-muted">
                  {chartCount}/{chartLimit === Infinity ? '∞' : chartLimit}
                </div>
              </div>
              <div className="h-[3px] bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue rounded-full transition-all"
                  style={{ width: `${storagePct}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-bold tracking-[-0.02em]">
                {profile?.first_name ? `${profile.first_name}'s charts` : 'Your charts'}
              </h1>
              {profile?.company && (
                <p className="font-mono text-[11px] text-muted mt-0.5">{profile.company}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-muted hidden sm:block">
                {chartCount} of {chartLimit === Infinity ? '∞' : chartLimit} used
              </span>
              <Link
                href="/editor"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-[7px] bg-text text-bg rounded-[8px] hover:opacity-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                New chart
              </Link>
            </div>
          </div>

          {/* Upgrade banner — free plan, close to limit */}
          {plan === 'free' && remaining <= 3 && (
            <div className="bg-blue-bg border border-blue rounded-[10px] p-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-blue flex-shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-text">
                    {remaining <= 0 ? 'Chart limit reached' : `${remaining} chart${remaining === 1 ? '' : 's'} left on Free`}
                  </div>
                  <div className="text-[11px] text-muted font-mono mt-0.5">
                    Pro: $1/mo · 50 charts · no watermark · SVG export
                  </div>
                </div>
              </div>
              <CheckoutButton
                plan="pro"
                className="text-[12px] font-semibold px-3 py-1.5 bg-blue text-white rounded-[6px] hover:opacity-90 transition-all flex-shrink-0 ml-4 cursor-pointer"
              >
                Upgrade →
              </CheckoutButton>
            </div>
          )}

          {/* Charts grid */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
            {/* New chart card */}
            <Link
              href="/editor"
              className="border border-dashed border-border rounded-[10px] h-[210px] flex flex-col items-center justify-center gap-2 text-muted hover:border-blue hover:text-blue hover:bg-blue-bg transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full border border-dashed border-current flex items-center justify-center group-hover:border-blue transition-all">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[12px] font-medium">New chart</span>
            </Link>

            {/* Real charts */}
            {charts.map(chart => (
              <Link
                key={chart.id}
                href={`/editor?id=${chart.id}`}
                className="bg-surface border border-border rounded-[10px] overflow-hidden hover:border-blue hover:shadow-[0_0_0_3px_var(--color-blue-bg)] transition-all"
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
                    {chart.chart_type || 'Chart'} · {timeAgo(chart.updated_at)}
                  </div>
                </div>
              </Link>
            ))}

            {/* Empty state */}
            {charts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-[12px] bg-surface-2 border border-border flex items-center justify-center mb-4">
                  <BarChart2 className="w-6 h-6 text-muted" />
                </div>
                <div className="text-[15px] font-semibold mb-1.5">No charts yet</div>
                <div className="font-mono text-[12px] text-muted mb-6 max-w-[240px]">
                  Create your first chart and it will appear here.
                </div>
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-[9px] bg-text text-bg rounded-[8px] hover:opacity-90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create first chart
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
