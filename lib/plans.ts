export type PlanType = 'free' | 'pro' | 'biz'

export const PLAN_LIMITS = {
  free: {
    charts:         5,
    storage_mb:     5,
    brand_profiles: 0,
    export_res_max: 1,
    export_svg:     false,
    watermark:      true,
    social_overlay: false,
    logo_in_kit:    false,
  },
  pro: {
    charts:         50,
    storage_mb:     50,
    brand_profiles: 1,
    export_res_max: 2,
    export_svg:     true,
    watermark:      false,
    social_overlay: true,
    logo_in_kit:    false,
  },
  biz: {
    charts:         Infinity,
    storage_mb:     500,
    brand_profiles: 3,
    export_res_max: 3,
    export_svg:     true,
    watermark:      false,
    social_overlay: true,
    logo_in_kit:    true,
  },
} as const

export const PLAN_PRICES = {
  pro: { usd_cents: 100, display: '$1/month' },
  biz: { usd_cents: 500, display: '$5/month' },
}

export function canCreateChart(plan: PlanType, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan].charts
  return currentCount < limit
}

export function canExportSVG(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].export_svg
}

export function canUseSocialOverlay(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].social_overlay
}

export function getMaxExportRes(plan: PlanType): 1 | 2 | 3 {
  return PLAN_LIMITS[plan].export_res_max as 1 | 2 | 3
}

export function hasWatermark(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].watermark
}

export function getChartLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].charts
}

export function getStorageLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].storage_mb
}

export function getBrandProfileLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].brand_profiles
}
