// Runtime env-var validation
// Warns on missing vars so the app still starts during development.
// In production, missing vars will surface as runtime errors on first use.

const server = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
] as const

const client = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
] as const

if (typeof window === 'undefined') {
  for (const key of server) {
    if (!process.env[key]) {
      console.warn(`[Glyph] Missing server env var: ${key}`)
    }
  }
}

for (const key of client) {
  if (!process.env[key]) {
    console.warn(`[Glyph] Missing client env var: ${key}`)
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL || '',
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpaySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  razorpayPublicKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}
