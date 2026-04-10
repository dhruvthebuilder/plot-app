import { redis, CacheKeys, CacheTTL } from './redis'
import type { PlanType } from './plans'

// Get user plan — check Redis first, fall back to Postgres
export async function getUserPlan(userId: string): Promise<PlanType> {
  if (redis) {
    try {
      const cached = await redis.get<PlanType>(CacheKeys.userPlan(userId))
      if (cached) return cached
    } catch {}
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createServiceClient } = await import('./supabase')
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single()

      const plan = (data?.plan || 'free') as PlanType
      if (redis) {
        await redis.setex(CacheKeys.userPlan(userId), CacheTTL.plan, plan)
      }
      return plan
    } catch {}
  }

  return 'free'
}

// Invalidate plan cache — call this after successful payment webhook
export async function invalidatePlanCache(userId: string) {
  if (!redis) return
  try {
    await redis.del(CacheKeys.userPlan(userId))
    await redis.del(CacheKeys.userProfile(userId))
  } catch {}
}
