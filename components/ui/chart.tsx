'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Plot uses react-chartjs-2 — this file is a compatibility stub
// The recharts-based chart component has been removed

export function ChartContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>
}

export function ChartTooltipContent() {
  return null
}

export function ChartLegendContent() {
  return null
}

export type ChartConfig = Record<string, { label?: string; color?: string }>
