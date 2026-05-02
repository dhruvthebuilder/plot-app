'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void }
  }
}

interface Props {
  plan: 'pro' | 'biz'
  className?: string
  children: React.ReactNode
  onSuccess?: () => void
}

export function CheckoutButton({ plan, className, children, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Load Razorpay checkout script on demand
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Could not load payment script'))
          document.head.appendChild(script)
        })
      }

      // Create the subscription on our server
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const body = await res.json()

      if (!res.ok) {
        throw new Error(body.error || 'Failed to start checkout')
      }

      const { subscription_id, key_id } = body

      // Open Razorpay checkout modal
      const rzp = new window.Razorpay({
        key: key_id,
        subscription_id,
        name: 'Glyph',
        description: plan === 'pro' ? 'Pro — $1/month' : 'Business — $5/month',
        handler: () => {
          // Webhook handles plan activation in the background.
          // Reload so the UI reflects the new plan once Supabase is updated.
          onSuccess?.()
          window.location.href = '/dashboard?upgraded=1'
        },
        theme: { color: '#1D6EE8' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })

      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }, [plan, onSuccess])

  return (
    <span className="inline-block">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={cn(className, loading && 'opacity-60 cursor-not-allowed')}
      >
        {loading ? 'Opening checkout…' : children}
      </button>
      {error && (
        <span className="block font-mono text-[10px] text-[#E24B4A] mt-1">{error}</span>
      )}
    </span>
  )
}
