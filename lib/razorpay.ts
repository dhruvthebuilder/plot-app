import Razorpay from 'razorpay'

// Razorpay client — only instantiated when credentials are present
export let razorpay: Razorpay | null = null

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// Set these to actual plan IDs from Razorpay dashboard
export const RAZORPAY_PLAN_IDS: Record<'pro' | 'biz', string> = {
  pro: process.env.RAZORPAY_PLAN_ID_PRO || 'plan_pro_placeholder',
  biz: process.env.RAZORPAY_PLAN_ID_BIZ || 'plan_biz_placeholder',
}
