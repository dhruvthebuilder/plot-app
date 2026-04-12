import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { redis, CacheKeys, CacheTTL } from '@/lib/redis'

const ALLOWED_FIELDS = ['first_name', 'last_name', 'company', 'industry']

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Try cache
  if (redis) {
    try {
      const cached = await redis.get(CacheKeys.userProfile(user.id))
      if (cached) return NextResponse.json(cached)
    } catch {}
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Cache
  if (redis) {
    try { await redis.set(CacheKeys.userProfile(user.id), data, { ex: CacheTTL.profile }) } catch {}
  }

  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED_FIELDS) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Invalidate cache
  if (redis) {
    try { await redis.del(CacheKeys.userProfile(user.id)) } catch {}
  }

  return NextResponse.json(data)
}
