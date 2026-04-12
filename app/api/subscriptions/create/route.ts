import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { razorpay, RAZORPAY_PLAN_IDS } from '@/lib/razorpay'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: 'pro' | 'biz' }
  if (!plan || !['pro', 'biz'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!razorpay) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  try {
    const planId = RAZORPAY_PLAN_IDS[plan]
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID not configured' }, { status: 503 })
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 0,
    } as Parameters<typeof razorpay.subscriptions.create>[0])

    // Record in DB with status pending
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan,
      status: 'pending',
      razorpay_subscription_id: subscription.id,
    })

    return NextResponse.json({
      subscription_id: subscription.id,
      key_id: env.razorpayPublicKey,
    })
  } catch (err) {
    console.error('Razorpay create subscription error:', err)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
