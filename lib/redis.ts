import { Redis } from '@upstash/redis'

// Redis is optional — if not configured, caching is skipped gracefully
export let redis: Redis | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// Cache keys — centralise all key patterns here
export const CacheKeys = {
  userPlan: (userId: string) => `user:${userId}:plan`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  chartList: (userId: string) => `user:${userId}:charts`,
  publicChart: (slug: string) => `chart:public:${slug}`,
}

// TTLs in seconds
export const CacheTTL = {
  plan: 300,        // 5 minutes — invalidated on payment webhook
  profile: 600,     // 10 minutes
  chartList: 60,    // 1 minute — short because charts update frequently
  publicChart: 3600 // 1 hour — public charts rarely change
}
