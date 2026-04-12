'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Chart as ChartJS, registerables } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  parseCSV,
  detectChartType,
  buildChartConfig,
  computeStats,
  type PlotChartType,
} from '@/lib/chartEngine'

ChartJS.register(...registerables)

const DEFAULT_CSV = `Label, Value
Jan, 42
Feb, 67
Mar, 38
Apr, 91
May, 55
Jun, 74`

const COLOR_PALETTE = ['#1D6EE8', '#111111', '#F0A500', '#10B981', '#E24B4A', '#7C3AED']

const CHART_TYPES: { type: PlotChartType; label: string }[] = [
  {
    type: 'bar',
    label: 'bar',
  },
  {
    type: 'line',
    label: 'line',
  },
  {
    type: 'doughnut',
    label: 'donut',
  },
  {
    type: 'scatter',
    label: 'scatter',
  },
  {
    type: 'bar',
    label: 'h-bar',
  },
]

function ChartIcon({ type }: { type: string }) {
  if (type === 'bar')
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
        <rect x="1" y="4" width="3" height="10" opacity=".6" rx="1" />
        <rect x="5" y="1" width="3" height="13" rx="1" />
        <rect x="9" y="6" width="3" height="8" opacity=".7" rx="1" />
        <rect x="13" y="3" width="3" height="11" opacity=".8" rx="1" />
      </svg>
    )
  if (type === 'line')
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="1,12 5,7 9,9 13,3 17,6" />
      </svg>
    )
  if (type === 'donut')
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="3.5">
        <circle cx="9" cy="7" r="5" strokeDasharray="12 8" />
      </svg>
    )
  if (type === 'scatter')
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
        <circle cx="4" cy="10" r="2" opacity=".7" />
        <circle cx="9" cy="4" r="2" />
        <circle cx="14" cy="8" r="2" opacity=".8" />
        <circle cx="7" cy="11" r="2" opacity=".5" />
      </svg>
    )
  // h-bar
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
      <rect x="1" y="2" width="10" height="3" opacity=".7" rx="1" />
      <rect x="1" y="6" width="16" height="3" rx="1" />
      <rect x="1" y="10" width="7" height="3" opacity=".6" rx="1" />
    </svg>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-[30px] h-[17px] rounded-full relative transition-colors flex-shrink-0',
        on ? 'bg-text' : 'bg-faint'
      )}
    >
      <span
        className={cn(
          'absolute w-[13px] h-[13px] bg-white rounded-full top-[2px] left-[2px] transition-transform',
          on && 'translate-x-[13px]'
        )}
      />
    </button>
  )
}

function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#F0F0F0]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-[14px] py-[10px] flex items-center justify-between"
      >
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-muted">
          {title}
        </span>
        <span
          className={cn(
            'text-[10px] text-faint transition-transform duration-200',
            open && 'rotate-180'
          )}
        >
          ▾
        </span>
      </button>
      {open && <div className="px-[14px] pb-[12px] flex flex-col gap-[8px]">{children}</div>}
    </div>
  )
}

function EditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idParam = searchParams.get('id')

  const chartRef = useRef<ChartJS | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // State per spec
  const [csvData, setCsvData] = useState(DEFAULT_CSV)
  const [chartType, setChartType] = useState<PlotChartType>('bar')
  const [selectedColor, setSelectedColor] = useState('#1D6EE8')
  const [opacity, setOpacity] = useState(85)
  const [cornerRadius, setCornerRadius] = useState(4)
  const [showGrid, setShowGrid] = useState(true)
  const [smooth, setSmooth] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [showWatermark, setShowWatermark] = useState(true)
  const [headline, setHeadline] = useState('')
  const [caption, setCaption] = useState('')
  const [overlayPosition, setOverlayPosition] = useState<'bottom' | 'top'>('bottom')
  const [showLegend, setShowLegend] = useState(false)
  const [legendPosition, setLegendPosition] = useState<'bottom' | 'top' | 'right'>('bottom')
  const [chartId, setChartId] = useState<string | null>(idParam)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png')
  const [exportRes, setExportRes] = useState<1 | 2 | 3>(1)
  const [exportBg, setExportBg] = useState<'white' | 'offwhite' | 'dark' | 'transparent'>('white')
  const [includeOverlay, setIncludeOverlay] = useState(true)
  const [includeWatermark, setIncludeWatermark] = useState(true)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'chart-type': true,
    data: true,
    visual: true,
    axes: false,
    titletext: false,
    social: false,
    legend: false,
  })

  // Parse data
  const { labels, values, rawRows } = parseCSV(csvData)
  const detectedType = detectChartType(labels, values)
  const { data, options } = buildChartConfig(chartType, labels, values, {
    color: selectedColor,
    opacity,
    cornerRadius,
    showGrid,
    smooth,
  })
  const stats = computeStats(values)

  const toggleSection = useCallback(
    (key: string) =>
      setOpenSections(prev => ({ ...prev, [key]: !prev[key] })),
    []
  )

  // Load existing chart on mount
  useEffect(() => {
    if (!idParam) return
    fetch(`/api/charts/${idParam}`)
      .then(r => r.json())
      .then(chart => {
        if (!chart || chart.error) return
        setCsvData(chart.raw_data || DEFAULT_CSV)
        setChartType((chart.chart_type as PlotChartType) || 'bar')
        setTitle(chart.title || '')
        setSubtitle(chart.subtitle || '')
        setSourceText(chart.source_text || '')
        const cfg = chart.config || {}
        setSelectedColor(cfg.color || '#1D6EE8')
        setOpacity(cfg.opacity ?? 85)
        setCornerRadius(cfg.cornerRadius ?? 4)
        setShowGrid(cfg.showGrid ?? true)
        setSmooth(cfg.smooth ?? false)
        const soc = chart.social_text || {}
        setHeadline(soc.headline || '')
        setCaption(soc.caption || '')
        setOverlayPosition(soc.overlayPosition || 'bottom')
        setShowLegend(soc.showLegend ?? false)
      })
      .catch(() => {})
  }, [idParam])

  // Auto-save debounce — 2000ms
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true)
      const payload = {
        title,
        subtitle,
        source_text: sourceText,
        chart_type: chartType,
        raw_data: csvData,
        data_json: { labels, values },
        config: { color: selectedColor, opacity, cornerRadius, showGrid, smooth },
        social_text: { headline, caption, overlayPosition, showLegend },
      }
      try {
        if (!chartId) {
          const res = await fetch('/api/charts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const created = await res.json()
          if (created?.id) {
            setChartId(created.id)
            router.replace(`/editor?id=${created.id}`, { scroll: false })
          }
        } else {
          await fetch(`/api/charts/${chartId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        }
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 1800)
      } catch {
        // silent fail — will retry on next change
      }
      setIsSaving(false)
    }, 2000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    csvData, chartType, selectedColor, opacity, cornerRadius, showGrid, smooth,
    title, subtitle, sourceText, showWatermark, headline, caption, overlayPosition,
    showLegend,
  ])

  // Export PNG
  const handleExportPNG = () => {
    const canvas = chartRef.current?.canvas
    if (!canvas) return
    const scale = exportRes
    const w = canvas.width * scale
    const h = canvas.height * scale
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const ctx = off.getContext('2d')!
    if (exportBg !== 'transparent') {
      ctx.fillStyle =
        exportBg === 'white' ? '#FFFFFF' : exportBg === 'offwhite' ? '#F7F3EC' : '#111111'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(canvas, 0, 0, w, h)
    if (includeWatermark && showWatermark) {
      ctx.font = `${10 * scale}px IBM Plex Mono`
      ctx.fillStyle = exportBg === 'dark' ? '#555555' : '#C8C8C8'
      ctx.fillText('Made with Plot · plot.so', 12 * scale, h - 12 * scale)
    }
    const link = document.createElement('a')
    link.download = `plot-chart-${Date.now()}.png`
    link.href = off.toDataURL('image/png')
    link.click()
    setShowExportModal(false)
  }

  // Export SVG
  const handleExportSVG = () => {
    const canvas = chartRef.current?.canvas
    if (!canvas) return
    const b64 = canvas.toDataURL('image/png')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
  <image href="${b64}" width="${canvas.width}" height="${canvas.height}"/>
  ${title ? `<text x="20" y="30" font-family="Syne,sans-serif" font-size="18" font-weight="700" fill="#111">${title}</text>` : ''}
  ${showWatermark ? `<text x="12" y="${canvas.height - 12}" font-family="IBM Plex Mono,monospace" font-size="10" fill="#C8C8C8">Made with Plot · plot.so</text>` : ''}
</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = `plot-chart-${Date.now()}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    setShowExportModal(false)
  }

  const chartJsType =
    chartType === 'doughnut' ? 'doughnut' :
    chartType === 'scatter' ? 'scatter' :
    chartType === 'line' ? 'line' : 'bar'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg">
      {/* Nav */}
      <nav className="bg-surface border-b border-border h-[52px] flex items-center justify-between px-6 flex-shrink-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[28px] h-[28px] bg-text rounded-[6px] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="8" width="3" height="7" fill="white" rx="1" />
              <rect x="6" y="4" width="3" height="11" fill="white" rx="1" />
              <rect x="11" y="1" width="3" height="14" fill="white" rx="1" />
              <circle cx="2.5" cy="7" r="1.5" fill="#1D6EE8" />
              <circle cx="7.5" cy="3" r="1.5" fill="#1D6EE8" />
              <circle cx="12.5" cy="0.5" r="1.5" fill="#1D6EE8" />
            </svg>
          </div>
          <span className="text-[16px] font-extrabold tracking-[-0.03em]">Plot</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-[13px] font-medium px-4 py-[7px] rounded-[8px] border border-border-strong text-text hover:bg-bg hover:border-text transition-all"
          >
            ← Dashboard
          </Link>
          <button
            disabled={isSaving}
            className={cn(
              'text-[13px] font-medium px-4 py-[7px] rounded-[8px] border transition-all',
              savedFlash
                ? 'border-green bg-green-bg text-green'
                : 'border-border-strong text-text hover:bg-bg hover:border-text'
            )}
          >
            {savedFlash ? 'Saved ✓' : isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="text-[13px] font-medium px-4 py-[7px] rounded-[8px] border border-text bg-text text-white hover:bg-[#333] transition-all"
          >
            ↓ Export
          </button>
        </div>
      </nav>

      <div className="flex flex-1 min-h-0">
        {/* ── LEFT PANEL ── */}
        <div
          className="bg-surface border-r border-border overflow-y-auto flex flex-col flex-shrink-0"
          style={{ width: 272 }}
        >
          {/* 1 — Chart type */}
          <Section
            id="chart-type"
            title="Chart type"
            open={openSections['chart-type']}
            onToggle={() => toggleSection('chart-type')}
          >
            <div className="grid grid-cols-5 gap-1">
              {CHART_TYPES.map((ct, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setChartType(ct.type)}
                  className={cn(
                    'flex flex-col items-center gap-[3px] py-[6px] px-1 border rounded-[5px] transition-all text-[8px] font-mono',
                    chartType === ct.type && ct.label !== 'h-bar'
                      ? 'bg-text text-white border-text'
                      : 'bg-bg border-border text-muted hover:border-blue-dark hover:text-blue'
                  )}
                >
                  <ChartIcon type={ct.label} />
                  {ct.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted bg-bg border border-border rounded-[5px] px-[10px] py-[6px]">
              <span className="bg-text text-white px-[6px] py-[1px] rounded-[3px] text-[9px]">auto</span>
              {detectedType} chart detected
            </div>
          </Section>

          {/* 2 — Data */}
          <Section
            id="data"
            title="Data"
            open={openSections['data']}
            onToggle={() => toggleSection('data')}
          >
            <textarea
              value={csvData}
              onChange={e => setCsvData(e.target.value)}
              className="w-full font-mono text-[11px] p-[9px] border border-border rounded-[6px] bg-bg text-text resize-vertical outline-none focus:border-blue transition-colors leading-[1.7]"
              style={{ minHeight: 110 }}
              placeholder={'Label, Value\nJan, 42'}
            />
            <div className="text-[9px] font-mono text-faint">
              CSV: Label, Value — one row per point
            </div>
          </Section>

          {/* 3 — Visual style */}
          <Section
            id="visual"
            title="Visual style"
            open={openSections['visual']}
            onToggle={() => toggleSection('visual')}
          >
            <div>
              <div className="text-[9px] font-mono text-muted mb-1.5">Color</div>
              <div className="flex items-center gap-[5px] flex-wrap">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all',
                      selectedColor === c ? 'border-text scale-[1.15]' : 'border-transparent'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">
                Opacity — {opacity}%
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="w-full h-[3px] bg-border rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[13px] [&::-webkit-slider-thumb]:h-[13px] [&::-webkit-slider-thumb]:bg-text [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_#111]"
              />
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">
                Corner radius — {cornerRadius}px
              </div>
              <input
                type="range"
                min={0}
                max={12}
                value={cornerRadius}
                onChange={e => setCornerRadius(Number(e.target.value))}
                className="w-full h-[3px] bg-border rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[13px] [&::-webkit-slider-thumb]:h-[13px] [&::-webkit-slider-thumb]:bg-text [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_#111]"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">Show grid</span>
              <Toggle on={showGrid} onToggle={() => setShowGrid(s => !s)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">Smooth lines</span>
              <Toggle on={smooth} onToggle={() => setSmooth(s => !s)} />
            </div>
          </Section>

          {/* 4 — Axes */}
          <Section
            id="axes"
            title="Axes"
            open={openSections['axes']}
            onToggle={() => toggleSection('axes')}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] font-mono text-muted mb-1">X label</div>
                <input
                  className="w-full text-[12px] px-[10px] py-[7px] border border-border rounded-[6px] bg-bg outline-none focus:border-blue transition-colors"
                  placeholder="Month"
                />
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted mb-1">Y label</div>
                <input
                  className="w-full text-[12px] px-[10px] py-[7px] border border-border rounded-[6px] bg-bg outline-none focus:border-blue transition-colors"
                  placeholder="Value"
                />
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">Tick format</div>
              <select className="w-full font-mono text-[11px] px-[10px] py-[7px] border border-border rounded-[6px] bg-bg outline-none focus:border-blue cursor-pointer">
                <option>Auto</option>
                <option>1K / 1M</option>
                <option>₹ Currency</option>
                <option>$ Currency</option>
                <option>Percentage %</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">Grid lines</span>
              <Toggle on={showGrid} onToggle={() => setShowGrid(s => !s)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">Log scale</span>
              <Toggle on={false} onToggle={() => {}} />
            </div>
          </Section>

          {/* 5 — Title & text */}
          <Section
            id="titletext"
            title="Title & text"
            open={openSections['titletext']}
            onToggle={() => toggleSection('titletext')}
          >
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">Chart title</div>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-[12px] px-[10px] py-[7px] border border-border rounded-[6px] bg-bg outline-none focus:border-blue transition-colors"
                placeholder="Monthly Performance"
              />
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">Subtitle</div>
              <input
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="w-full text-[12px] px-[10px] py-[7px] border border-border rounded-[6px] bg-bg outline-none focus:border-blue transition-colors"
                placeholder="Jan – Jun 2026"
              />
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">Source / footnote</div>
              <input
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                className="w-full text-[12px] px-[10px] py-[7px] border border-border rounded-[6px] bg-bg outline-none focus:border-blue transition-colors"
                placeholder="Source: Internal data"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">Show &quot;Made with Plot&quot;</span>
              <Toggle on={showWatermark} onToggle={() => setShowWatermark(s => !s)} />
            </div>
          </Section>

          {/* 6 — Social media overlay */}
          <Section
            id="social"
            title="Social media overlay"
            open={openSections['social']}
            onToggle={() => toggleSection('social')}
          >
            <p className="text-[10px] font-mono text-muted">
              Add text overlays for LinkedIn, X, and Instagram posts.
            </p>
            {/* Headline */}
            <div className="bg-bg border border-border rounded-[6px] p-[10px]">
              <div className="text-[10px] font-mono text-muted mb-[6px]">Headline text</div>
              <input
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                className="w-full text-[12px] px-[10px] py-[7px] border border-border rounded-[6px] bg-surface outline-none focus:border-blue transition-colors"
                placeholder="India's GDP grew 8.2% in Q4"
              />
              <div className="flex gap-1.5 mt-[6px]">
                <button
                  type="button"
                  onClick={() => setOverlayPosition('bottom')}
                  className={cn(
                    'flex-1 py-[5px] text-[9px] font-mono text-center border rounded-[5px] transition-all',
                    overlayPosition === 'bottom' ? 'bg-text text-white border-text' : 'border-border text-muted'
                  )}
                >
                  Bottom
                </button>
                <button
                  type="button"
                  onClick={() => setOverlayPosition('top')}
                  className={cn(
                    'flex-1 py-[5px] text-[9px] font-mono text-center border rounded-[5px] transition-all',
                    overlayPosition === 'top' ? 'bg-text text-white border-text' : 'border-border text-muted'
                  )}
                >
                  Top
                </button>
              </div>
            </div>
            {/* Caption */}
            <div className="bg-bg border border-border rounded-[6px] p-[10px]">
              <div className="flex items-center justify-between mb-[6px]">
                <span className="text-[10px] font-mono text-muted">Caption / source</span>
                <span className="text-[9px] font-mono bg-amber-bg text-[#B07800] px-[6px] py-[2px] rounded-[4px]">Pro</span>
              </div>
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full text-[12px] px-[10px] py-[7px] border border-border rounded-[6px] bg-surface outline-none focus:border-blue transition-colors"
                placeholder="Source: RBI Annual Report 2025"
              />
            </div>
            {/* Brand logo */}
            <div className="bg-bg border border-border rounded-[6px] p-[10px]">
              <div className="flex items-center justify-between mb-[6px]">
                <span className="text-[10px] font-mono text-muted">Brand logo on export</span>
                <span className="text-[9px] font-mono bg-amber-bg text-[#B07800] px-[6px] py-[2px] rounded-[4px]">Pro</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">Show logo watermark</span>
                <Toggle on={false} onToggle={() => {}} />
              </div>
            </div>
            {/* Format preset */}
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">Format preset</div>
              <div className="flex gap-1.5">
                {['Square 1:1', 'Portrait 4:5', 'Story 9:16'].map(f => (
                  <button
                    key={f}
                    type="button"
                    className="flex-1 py-[5px] text-[9px] font-mono text-center border border-border rounded-[5px] text-muted first:bg-text first:text-white first:border-text"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* 7 — Legend */}
          <Section
            id="legend"
            title="Legend"
            open={openSections['legend']}
            onToggle={() => toggleSection('legend')}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">Show legend</span>
              <Toggle on={showLegend} onToggle={() => setShowLegend(s => !s)} />
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted mb-1">Position</div>
              <select
                value={legendPosition}
                onChange={e => setLegendPosition(e.target.value as 'bottom' | 'top' | 'right')}
                className="w-full font-mono text-[11px] px-[10px] py-[7px] border border-border rounded-[6px] bg-bg outline-none focus:border-blue cursor-pointer"
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
                <option value="right">Right</option>
              </select>
            </div>
          </Section>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 bg-[#F2F2F2] p-5 flex flex-col gap-[14px] overflow-y-auto min-h-0">
          {/* Title/Subtitle inputs */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="block w-full text-[20px] font-bold tracking-[-0.02em] bg-transparent outline-none placeholder:text-faint"
                placeholder="Chart title"
              />
              <input
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="block w-full text-[11px] font-mono text-muted bg-transparent outline-none placeholder:text-faint mt-[2px]"
                placeholder="Subtitle or time period"
              />
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-[10px]">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Peak', value: stats.peak },
              { label: 'Average', value: stats.avg },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-border rounded-[8px] px-[14px] py-[12px]">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.08em] mb-[4px]">
                  {s.label}
                </div>
                <div className="text-[19px] font-bold tracking-[-0.02em]">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Chart card */}
          <div className="bg-surface border border-border rounded-[12px] px-6 py-5 flex flex-col flex-1">
            {/* Chart wrapper */}
            <div className="relative flex-1" style={{ minHeight: 260 }}>
              <Chart
                ref={chartRef}
                type={chartJsType}
                data={data}
                options={{
                  ...options,
                  plugins: {
                    ...options.plugins,
                    legend: {
                      ...options.plugins?.legend,
                      display: showLegend,
                      position: legendPosition,
                    },
                  },
                }}
              />
              {/* Social overlay */}
              {(headline || caption) && (
                <div
                  className={cn(
                    'absolute inset-0 pointer-events-none flex flex-col px-3 py-3',
                    overlayPosition === 'bottom' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {headline && (
                    <div
                      className="inline-block text-[14px] font-bold text-text px-2 py-1 rounded-[4px] mb-1 border-l-[3px] border-blue"
                      style={{ background: 'rgba(255,255,255,0.9)' }}
                    >
                      {headline}
                    </div>
                  )}
                  {caption && (
                    <div
                      className="inline-block text-[10px] font-mono text-muted px-[7px] py-[3px] rounded-[4px]"
                      style={{ background: 'rgba(255,255,255,0.9)' }}
                    >
                      {caption}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-[10px] mt-auto border-t border-border">
              <span className="font-mono text-[9px] text-faint">
                {showWatermark && <>Made with <strong className="text-muted">Plot</strong></>}
              </span>
              <span className="font-mono text-[9px] text-faint">{rawRows} data points</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPORT MODAL ── */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[500]"
          onClick={e => { if (e.target === e.currentTarget) setShowExportModal(false) }}
        >
          <div className="bg-surface border border-border rounded-[12px] w-[500px] overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 flex items-center justify-between">
              <span className="text-[16px] font-bold tracking-[-0.02em]">Export chart</span>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-[26px] h-[26px] rounded-full bg-bg border border-border flex items-center justify-center text-[12px] text-muted hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Format tabs */}
              <div className="flex border border-border rounded-[8px] overflow-hidden">
                {(['PNG', 'SVG'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setExportFormat(f.toLowerCase() as 'png' | 'svg')}
                    className={cn(
                      'flex-1 py-2 text-[12px] font-medium text-center border-r last:border-r-0 border-border transition-all',
                      exportFormat === f.toLowerCase() ? 'bg-text text-white' : 'bg-bg text-muted'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* PNG options */}
              {exportFormat === 'png' && (
                <div>
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-muted mb-2">
                    Resolution
                  </div>
                  <div className="flex gap-2">
                    {([1, 2, 3] as const).map(r => (
                      <div key={r} className="relative">
                        <button
                          type="button"
                          onClick={() => setExportRes(r)}
                          className={cn(
                            'px-[14px] py-[6px] border rounded-[6px] font-mono text-[11px] transition-all',
                            exportRes === r ? 'bg-text text-white border-text' : 'border-border text-muted bg-bg'
                          )}
                        >
                          {r}×{' '}
                          <span className="text-faint">
                            {r === 1 ? '1200×800' : r === 2 ? '2400×1600' : '3600×2400'}
                          </span>
                        </button>
                        {r === 3 && (
                          <span className="absolute -top-1.5 -right-1 text-[8px] font-mono bg-amber-bg text-[#B07800] px-1 py-0.5 rounded-[3px]">
                            Biz
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Background */}
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-muted mb-2">
                  Background
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { key: 'white', label: 'White', color: '#fff' },
                      { key: 'offwhite', label: 'Off-white', color: '#F7F3EC' },
                      { key: 'dark', label: 'Dark', color: '#111' },
                      { key: 'transparent', label: 'Transparent', color: null },
                    ] as const
                  ).map(bg => (
                    <button
                      key={bg.key}
                      type="button"
                      onClick={() => setExportBg(bg.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-[6px] border rounded-[6px] font-mono text-[11px] text-muted transition-all',
                        exportBg === bg.key ? 'border-text' : 'border-border'
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-[3px] border border-border"
                        style={{
                          background: bg.color ?? 'repeating-linear-gradient(45deg,#E0E0E0 0,#E0E0E0 1px,#fff 0,#fff 4px)',
                        }}
                      />
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-muted mb-2">
                  Social media text overlay
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted">Include headline + caption on export</span>
                  <Toggle on={includeOverlay} onToggle={() => setIncludeOverlay(s => !s)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted">&ldquo;Made with Plot&rdquo; watermark</span>
                <Toggle on={includeWatermark} onToggle={() => setIncludeWatermark(s => !s)} />
              </div>

              {/* Preview */}
              <div className="bg-bg border border-border rounded-[8px] h-[90px] flex items-center justify-center gap-[10px]">
                <div className="flex items-flex-end gap-[3px] h-[50px]">
                  {[42, 70, 32, 88, 52, 68].map((h, i) => (
                    <div
                      key={i}
                      className="w-[9px] rounded-t-[2px]"
                      style={{ height: `${h}%`, background: selectedColor, opacity: 0.6 + i * 0.07 }}
                    />
                  ))}
                </div>
                <div className="font-mono text-[9px] text-muted text-center">
                  {exportRes}× · {exportBg.charAt(0).toUpperCase() + exportBg.slice(1)} bg
                  <br />
                  Social overlay: {includeOverlay ? 'on' : 'off'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-2">
              <button
                type="button"
                onClick={handleExportSVG}
                className="flex-1 py-[9px] text-[13px] font-medium border border-border-strong rounded-[8px] text-text hover:bg-bg hover:border-text transition-all"
              >
                ↓ Download SVG
              </button>
              <button
                type="button"
                onClick={handleExportPNG}
                className="flex-1 py-[9px] text-[13px] font-semibold bg-text text-white border border-text rounded-[8px] hover:bg-[#333] transition-all"
              >
                ↓ Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-bg" />}>
      <EditorContent />
    </Suspense>
  )
}
