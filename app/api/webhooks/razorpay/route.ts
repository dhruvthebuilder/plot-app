import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase'
import { invalidatePlanCache } from '@/lib/plan-cache'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  // Verify HMAC-SHA256
  if (secret) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    const eventName = event.event as string
    const payload = (event.payload as Record<string, unknown>) || {}

    if (eventName === 'payment.captured') {
      const payment = (payload.payment as Record<string, Record<string, unknown>>)?.entity
      const subscriptionId = payment?.subscription_id as string | undefined
      const paymentId = payment?.id as string | undefined

      if (subscriptionId) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id, plan')
          .eq('razorpay_subscription_id', subscriptionId)
          .single()

        if (sub) {
          await supabase
            .from('subscriptions')
            .update({ status: 'active', razorpay_payment_id: paymentId })
            .eq('razorpay_subscription_id', subscriptionId)

          await supabase
            .from('profiles')
            .update({ plan: sub.plan })
            .eq('id', sub.user_id)

          await invalidatePlanCache(sub.user_id)
        }
      }
    }

    if (
      eventName === 'subscription.cancelled' ||
      eventName === 'subscription.completed'
    ) {
      const subscription = (payload.subscription as Record<string, Record<string, unknown>>)?.entity
      const subscriptionId = subscription?.id as string | undefined

      if (subscriptionId) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('razorpay_subscription_id', subscriptionId)
          .single()

        if (sub) {
          const newStatus = eventName === 'subscription.cancelled' ? 'cancelled' : 'completed'
          await supabase
            .from('subscriptions')
            .update({ status: newStatus })
            .eq('razorpay_subscription_id', subscriptionId)

          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', sub.user_id)

          await invalidatePlanCache(sub.user_id)
        }
      }
    }

    if (eventName === 'subscription.charged') {
      const subscription = (payload.subscription as Record<string, Record<string, unknown>>)?.entity
      const subscriptionId = subscription?.id as string | undefined

      if (subscriptionId) {
        await supabase
          .from('subscriptions')
          .update({
            current_period_start: subscription?.current_start
              ? new Date((subscription.current_start as number) * 1000).toISOString()
              : null,
            current_period_end: subscription?.current_end
              ? new Date((subscription.current_end as number) * 1000).toISOString()
              : null,
          })
          .eq('razorpay_subscription_id', subscriptionId)
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    // Always return 200 to acknowledge receipt
  }

  return NextResponse.json({ received: true })
}
