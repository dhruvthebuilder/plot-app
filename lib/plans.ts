export type PlanType = 'free' | 'pro' | 'biz'

export interface PlanLimits {
  charts: number
  storage_mb: number
  brand_profiles: number
  export_png_max: number // 1x, 2x, or 3x
  export_svg: boolean
  watermark: boolean
  social_overlay: boolean
  high_res: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    charts: 5,
    storage_mb: 5,
    brand_profiles: 0,
    export_png_max: 1,
    export_svg: false,
    watermark: true,
    social_overlay: false,
    high_res: false,
  },
  pro: {
    charts: 50,
    storage_mb: 50,
    brand_profiles: 1,
    export_png_max: 2,
    export_svg: true,
    watermark: false,
    social_overlay: true,
    high_res: false,
  },
  biz: {
    charts: Infinity,
    storage_mb: 500,
    brand_profiles: 3,
    export_png_max: 3,
    export_svg: true,
    watermark: false,
    social_overlay: true,
    high_res: true,
  },
}

export const PLAN_PRICES = {
  pro: { usd: 100, display: '$1/month' },
  biz: { usd: 500, display: '$5/month' },
} as const

export function canCreateChart(plan: PlanType, currentChartCount: number): boolean {
  const limit = PLAN_LIMITS[plan].charts
  return currentChartCount < limit
}

export function canExportSVG(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].export_svg
}

export function canUseSocialOverlay(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].social_overlay
}

export function getMaxExportResolution(plan: PlanType): number {
  return PLAN_LIMITS[plan].export_png_max
}

export function hasWatermark(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].watermark
}

export function getMaxBrandProfiles(plan: PlanType): number {
  return PLAN_LIMITS[plan].brand_profiles
}

export function getStorageLimitMB(plan: PlanType): number {
  return PLAN_LIMITS[plan].storage_mb
}
