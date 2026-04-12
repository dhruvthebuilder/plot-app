import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserPlan } from '@/lib/plan-cache'
import { PLAN_LIMITS } from '@/lib/plans'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [plan, profileResult, brandKitResult, chartsCountResult] = await Promise.all([
    getUserPlan(user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single(),
    supabase
      .from('charts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const brandKit = brandKitResult.data
  const chartCount = chartsCountResult.count || 0

  return (
    <SettingsClient
      plan={plan}
      profile={profile}
      brandKit={brandKit}
      chartCount={chartCount}
      chartLimit={PLAN_LIMITS[plan].charts}
      storageMb={PLAN_LIMITS[plan].storage_mb}
      email={user.email || ''}
    />
  )
}
