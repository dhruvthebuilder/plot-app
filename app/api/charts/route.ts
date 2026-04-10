import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PLAN_LIMITS } from '@/lib/plans'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check plan limit
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan || 'free') as 'free' | 'pro' | 'biz'
  const { count } = await supabase.from('charts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const limit = PLAN_LIMITS[plan].charts

  if (limit !== Infinity && (count || 0) >= limit) {
    return NextResponse.json({ error: 'Chart limit reached for your plan' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase.from('charts').insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
