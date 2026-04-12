import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserPlan } from '@/lib/plan-cache'
import { PLAN_LIMITS } from '@/lib/plans'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = await getUserPlan(user.id)
  const limit = PLAN_LIMITS[plan].brand_profiles

  const { count } = await supabase
    .from('brand_kits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (limit > 0 && (count || 0) >= limit) {
    return NextResponse.json(
      { error: `Brand profile limit reached. Upgrade for more.` },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { data, error } = await supabase
    .from('brand_kits')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
