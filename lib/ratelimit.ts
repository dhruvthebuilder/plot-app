import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

// Only instantiate if Redis is available
function makeLimiter(windowRequests: number, window: string, prefix: string) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(windowRequests, window as `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`),
    prefix,
  })
}

// Chart creation: 20 per minute per user
export const chartCreateLimiter = makeLimiter(20, '1 m', 'ratelimit:chart:create')

// API general: 100 per minute per user
export const apiLimiter = makeLimiter(100, '1 m', 'ratelimit:api')

// Auth: 10 attempts per 15 minutes per IP
export const authLimiter = makeLimiter(10, '15 m', 'ratelimit:auth')

// Helper to get user IP from request
export function getIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
}
