import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserPlan } from '@/lib/plan-cache'
import { PLAN_LIMITS } from '@/lib/plans'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [plan, profileResult, chartsResult] = await Promise.all([
    getUserPlan(user.id),
    supabase
      .from('profiles')
      .select('first_name, company')
      .eq('id', user.id)
      .single(),
    supabase
      .from('charts')
      .select('id, title, chart_type, config, thumbnail_url, updated_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50),
  ])

  const profile = profileResult.data
  const charts = chartsResult.data || []
  const chartCount = chartsResult.count || 0

  return (
    <DashboardClient
      plan={plan}
      profile={profile}
      charts={charts}
      chartCount={chartCount}
      chartLimit={PLAN_LIMITS[plan].charts}
      storageMb={PLAN_LIMITS[plan].storage_mb}
    />
  )
}
