'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Chart as ChartJS, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import {
  parseCSV,
  detectColTypes,
  suggestChartType,
  autoAssignMappings,
  buildChartConfig,
  CHART_TYPES,
  ROLES,
  type ChartType,
  type ColType,
  type ParsedTable,
  type VisualConfig,
} from '@/lib/chartEngine'

ChartJS.register(...registerables, ChartDataLabels)

const SWATCHES = ['#1D6EE8', '#111111', '#F0A500', '#10B981', '#E24B4A', '#7C3AED', '#EC4899']
const BG_MAP: Record<string, string> = { white: '#FFFFFF', offwhite: '#F7F3EC', dark: '#111111', transparent: 'transparent' }

const DEFAULT_VIS: VisualConfig = {
  color: '#1D6EE8', opacity: 85, radius: 4, bg: 'white',
  showGrid: true, smooth: false, logScale: false,
  showLabels: false, showAvgLine: false, showLegend: false,
  xLabel: '', yLabel: '', tickFormat: 'auto',
  lineWidth: 2.5, pointSize: 4, barWidth: 'auto',
}

// Per-chart-type capability flags — controls which Visual/Axes inputs are shown
const CHART_CAPS: Record<ChartType, { hasRadius: boolean; hasSmooth: boolean; hasLog: boolean; hasGrid: boolean; hasLineWidth: boolean; hasPointSize: boolean; hasBarWidth: boolean }> = {
  'bar-vertical':   { hasRadius: true,  hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: true  },
  'bar-horizontal': { hasRadius: true,  hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: true  },
  'bar-grouped':    { hasRadius: true,  hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: true  },
  'bar-stacked':    { hasRadius: true,  hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: true  },
  'lollipop':       { hasRadius: true,  hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'line':           { hasRadius: false, hasSmooth: true,  hasLog: true,  hasGrid: true,  hasLineWidth: true,  hasPointSize: true,  hasBarWidth: false },
  'line-multi':     { hasRadius: false, hasSmooth: true,  hasLog: true,  hasGrid: true,  hasLineWidth: true,  hasPointSize: true,  hasBarWidth: false },
  'area':           { hasRadius: false, hasSmooth: true,  hasLog: true,  hasGrid: true,  hasLineWidth: true,  hasPointSize: true,  hasBarWidth: false },
  'area-stacked':   { hasRadius: false, hasSmooth: true,  hasLog: true,  hasGrid: true,  hasLineWidth: true,  hasPointSize: true,  hasBarWidth: false },
  'step':           { hasRadius: false, hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: true,  hasPointSize: true,  hasBarWidth: false },
  'pie':            { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'doughnut':       { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'treemap':        { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'waffle':         { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'histogram':      { hasRadius: false, hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'box-plot':       { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'dot-plot':       { hasRadius: false, hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: true,  hasBarWidth: false },
  'scatter':        { hasRadius: false, hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: true,  hasBarWidth: false },
  'bubble':         { hasRadius: false, hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'heatmap':        { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'candlestick':    { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'waterfall':      { hasRadius: true,  hasSmooth: false, hasLog: false, hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: true  },
  'funnel':         { hasRadius: true,  hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: false, hasPointSize: false, hasBarWidth: true  },
  'sankey':         { hasRadius: true,  hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'radar':          { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: true,  hasPointSize: true,  hasBarWidth: false },
  'bar-line':       { hasRadius: true,  hasSmooth: true,  hasLog: false, hasGrid: true,  hasLineWidth: true,  hasPointSize: true,  hasBarWidth: true  },
  'gauge':          { hasRadius: false, hasSmooth: false, hasLog: false, hasGrid: false, hasLineWidth: false, hasPointSize: false, hasBarWidth: false },
  'line-area':      { hasRadius: false, hasSmooth: true,  hasLog: true,  hasGrid: true,  hasLineWidth: true,  hasPointSize: true,  hasBarWidth: false },
  'error-bar':      { hasRadius: true,  hasSmooth: false, hasLog: true,  hasGrid: true,  hasLineWidth: false, hasPointSize: false, hasBarWidth: true  },
}

export default function EditorPage() {
  return (
    <Suspense>
      <EditorInner />
    </Suspense>
  )
}

function EditorInner() {
  const searchParams = useSearchParams()
  const chartId = searchParams.get('id')

  // ── Navigation ──
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [savedChartId, setSavedChartId] = useState<string | null>(null)

  // ── Data ──
  const [table, setTable] = useState<ParsedTable | null>(null)
  const [colTypes, setColTypes] = useState<ColType[]>([])
  const [chartType, setChartType] = useState<ChartType>('bar-vertical')
  const [mappings, setMappings] = useState<Record<string, number>>({})
  const [dragOver, setDragOver] = useState(false)
  const [pasteText, setPasteText] = useState('')

  // ── Visual config ──
  const [vis, setVis] = useState<VisualConfig>(DEFAULT_VIS)
  // Separate state for hex color input — allows partial typing without flashing
  const [colorInput, setColorInput] = useState(DEFAULT_VIS.color)

  // ── Text overlays ──
  const [chartTitle, setChartTitle] = useState('')
  const [chartSubtitle, setChartSubtitle] = useState('')
  const [chartSource, setChartSource] = useState('')
  const [incWatermark, setIncWatermark] = useState(true)

  // ── Export modal ──
  const [showExport, setShowExport] = useState(false)
  const [expFormat, setExpFormat] = useState<'png' | 'svg'>('png')
  const [expRes, setExpRes] = useState(1)
  const [expBg, setExpBg] = useState<'white' | 'offwhite' | 'dark' | 'transparent'>('white')
  const [incTitle, setIncTitle] = useState(true)

  // ── Left panel sections ──
  const [openSections, setOpenSections] = useState({
    type: true, mapping: true, visual: true, axes: false, annotations: false, text: false,
  })
  const [typeSearch, setTypeSearch] = useState('')

  // ── Save ──
  const [isSaving, setIsSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  // ── Chart refs ──
  const chartRef = useRef<ChartJS | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep a ref to the latest vis so the recreation effect always uses current values
  const visRef = useRef(vis)
  useEffect(() => { visRef.current = vis }, [vis])

  // Sync colorInput when vis.color changes externally (swatch click, chart load)
  useEffect(() => { setColorInput(vis.color) }, [vis.color])

  // ── Effect 1: Full recreation when structure changes (chart type, data, mappings) ──
  useEffect(() => {
    if (currentStep !== 2 || !canvasRef.current || !table) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
    const cfg = buildChartConfig(table, mappings, chartType, visRef.current)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartRef.current = new ChartJS(canvasRef.current, cfg as any)
    return () => { chartRef.current?.destroy(); chartRef.current = null }
    // vis intentionally excluded — handled by effect 2
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, table, mappings, chartType])

  // ── Effect 2: In-place update for visual config changes (no recreation) ──
  useEffect(() => {
    if (!chartRef.current || !table) return
    const cfg = buildChartConfig(table, mappings, chartType, vis)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartRef.current.data = cfg.data as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartRef.current.options = cfg.options as any
    chartRef.current.update('active')
    // table/mappings/chartType intentionally excluded — structural changes handled by effect 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vis])

  // ── Global paste listener ──
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const active = document.activeElement
      if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return
      const text = e.clipboardData?.getData('text/plain')
      if (text?.trim()) processText(text)
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [])

  // ── Load saved chart ──
  useEffect(() => {
    if (!chartId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/charts/${chartId}`)
        if (!res.ok) return
        const chart = await res.json()
        const cfg = chart.config as {
          vis?: VisualConfig; chartTitle?: string; chartSubtitle?: string
          chartSource?: string; mappings?: Record<string, number>
          chartType?: ChartType; table?: ParsedTable; incWatermark?: boolean
        }
        if (!cfg) return
        if (cfg.table) {
          const types = detectColTypes(cfg.table)
          setTable(cfg.table)
          setColTypes(types)
        }
        if (cfg.chartType) setChartType(cfg.chartType)
        if (cfg.mappings) setMappings(cfg.mappings)
        if (cfg.vis) setVis(cfg.vis)
        if (cfg.chartTitle !== undefined) setChartTitle(cfg.chartTitle)
        if (cfg.chartSubtitle !== undefined) setChartSubtitle(cfg.chartSubtitle)
        if (cfg.chartSource !== undefined) setChartSource(cfg.chartSource)
        if (cfg.incWatermark !== undefined) setIncWatermark(cfg.incWatermark)
        setSavedChartId(chartId)
        setCurrentStep(2)
      } catch { /* ignore */ }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartId])

  // ── Data processing ──
  const processText = useCallback((text: string) => {
    const t = parseCSV(text)
    if (!t || t.rowCount < 1) return
    const types = detectColTypes(t)
    const suggested = suggestChartType(t, types)
    setTable(t)
    setColTypes(types)
    setChartType(suggested)
    setMappings(autoAssignMappings(t, suggested))
  }, [])

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const csv = XLSX.utils.sheet_to_csv(ws)
      processText(csv)
    } else {
      const text = await file.text()
      processText(text)
    }
  }, [processText])

  // ── Chart type selection ──
  const selectChartType = (id: ChartType) => {
    setChartType(id)
    if (table) setMappings(autoAssignMappings(table, id))
  }

  // ── Section toggle ──
  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(s => ({ ...s, [key]: !s[key] }))
  }

  // ── Save ──
  const handleSave = async () => {
    if (!table) return
    setIsSaving(true)
    setSaveState('idle')
    try {
      const payload = {
        title: chartTitle || 'Untitled chart',
        chart_type: chartType,
        config: { vis, chartTitle, chartSubtitle, chartSource, mappings, chartType, table, incWatermark },
      }
      const isUpdate = !!savedChartId
      const res = await fetch(isUpdate ? `/api/charts/${savedChartId}` : '/api/charts', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { setSaveState('error'); return }
      if (!isUpdate) {
        const data = await res.json()
        if (data?.id) setSavedChartId(data.id)
      }
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1800)
    } catch {
      setSaveState('error')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Export ──
  const downloadPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const scale = expRes
    const w = canvas.width * scale
    const h = canvas.height * scale
    const bgColors: Record<string, string> = { white: '#FFFFFF', offwhite: '#F7F3EC', dark: '#111111', transparent: 'transparent' }

    // Add padding so title sits above the chart, not on top of it
    const PAD_TOP = incTitle && chartTitle ? Math.round(54 * scale) : 0
    const PAD_SIDES = Math.round(24 * scale)
    const PAD_BOTTOM = Math.round(32 * scale)
    const totalW = w + PAD_SIDES * 2
    const totalH = h + PAD_TOP + PAD_BOTTOM

    const off = document.createElement('canvas')
    off.width = totalW; off.height = totalH
    const ctx = off.getContext('2d')!

    if (expBg !== 'transparent') { ctx.fillStyle = bgColors[expBg] || '#fff'; ctx.fillRect(0, 0, totalW, totalH) }
    // Draw chart canvas offset down + right so title fits above
    ctx.drawImage(canvas, PAD_SIDES, PAD_TOP, w, h)

    // Title block above chart
    if (incTitle && chartTitle) {
      ctx.fillStyle = expBg === 'dark' ? '#fff' : '#111'
      ctx.font = `bold ${18 * scale}px Helvetica,Arial,sans-serif`
      ctx.fillText(chartTitle, PAD_SIDES, 22 * scale)
      if (chartSubtitle) {
        ctx.font = `${12 * scale}px Helvetica,Arial,sans-serif`
        ctx.fillStyle = expBg === 'dark' ? '#aaa' : '#888'
        ctx.fillText(chartSubtitle, PAD_SIDES, 38 * scale)
      }
    }
    // Source at bottom-left
    if (incTitle && chartSource) {
      ctx.font = `${10 * scale}px Helvetica,Arial,sans-serif`
      ctx.fillStyle = expBg === 'dark' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.35)'
      ctx.fillText(chartSource, PAD_SIDES, totalH - 12 * scale)
    }
    // Watermark bottom-right (uses measureText so it's correctly right-aligned at any resolution)
    if (incWatermark) {
      const wm = 'Made with Plot · plot.so'
      ctx.font = `${9 * scale}px Helvetica,Arial,sans-serif`
      ctx.fillStyle = expBg === 'dark' ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.18)'
      const wmW = ctx.measureText(wm).width
      ctx.fillText(wm, totalW - wmW - PAD_SIDES, totalH - 8 * scale)
    }
    const link = document.createElement('a')
    link.download = `plot-${(chartTitle || 'chart').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
    link.href = off.toDataURL('image/png')
    link.click()
    setShowExport(false)
  }

  const downloadSVG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const base64 = canvas.toDataURL('image/png')
    const titleH = incTitle && chartTitle ? 54 : 0
    const svgH = canvas.height + titleH + 32  // +32 bottom padding
    const svgW = canvas.width + 48             // +24 each side
    const bgFill = expBg === 'dark' ? '#111' : expBg === 'offwhite' ? '#F7F3EC' : expBg === 'transparent' ? 'none' : '#fff'
    const textColor = expBg === 'dark' ? '#fff' : '#111'
    const subtitleColor = expBg === 'dark' ? '#aaa' : '#888'
    const titleLine = incTitle && chartTitle
      ? `<text x="24" y="24" font-family="Helvetica,Arial,sans-serif" font-size="18" font-weight="bold" fill="${textColor}">${chartTitle}</text>` +
        (chartSubtitle ? `<text x="24" y="42" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="${subtitleColor}">${chartSubtitle}</text>` : '')
      : ''
    const sourceLine = incTitle && chartSource
      ? `<text x="24" y="${svgH - 10}" font-family="Helvetica,Arial,sans-serif" font-size="10" fill="${expBg === 'dark' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.35)'}">${chartSource}</text>`
      : ''
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">
  <rect width="${svgW}" height="${svgH}" fill="${bgFill}"/>
  ${titleLine}
  <image href="${base64}" x="24" y="${titleH}" width="${canvas.width}" height="${canvas.height}"/>
  ${sourceLine}
  ${incWatermark ? `<text x="${svgW - 145}" y="${svgH - 8}" font-family="Helvetica,Arial,sans-serif" font-size="9" fill="${expBg === 'dark' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)'}">Made with Plot · plot.so</text>` : ''}
</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = `plot-${(chartTitle || 'chart').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    setShowExport(false)
  }

  const suggestedType = table ? suggestChartType(table, colTypes) : 'bar-vertical'
  const suggestedLabel = CHART_TYPES.find(t => t.id === suggestedType)?.label || 'Bar'
  const cardBg = BG_MAP[vis.bg] || '#fff'
  const cardText = vis.bg === 'dark' ? '#fff' : '#111'
  const caps = CHART_CAPS[chartType] ?? CHART_CAPS['bar-vertical']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ── */}
      <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 28, height: 28, background: 'var(--color-text)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="8" width="3" height="7" fill="var(--color-bg)" rx="1" />
              <rect x="6" y="4" width="3" height="11" fill="var(--color-bg)" rx="1" />
              <rect x="11" y="1" width="3" height="14" fill="var(--color-bg)" rx="1" />
              <circle cx="2.5" cy="7" r="1.5" fill="var(--color-blue)" />
              <circle cx="7.5" cy="3" r="1.5" fill="var(--color-blue)" />
              <circle cx="12.5" cy="0.5" r="1.5" fill="var(--color-blue)" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)' }}>Plot</span>
        </Link>

        {/* Step tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(['01 Add data', '02 Customise', '03 Export'] as const).map((label, i) => {
            const step = i + 1
            const isActive = currentStep === step || (step === 3 && showExport)
            const isDone = currentStep > step
            return (
              <div key={label} style={{
                fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                color: isActive ? 'var(--color-text)' : isDone ? 'var(--color-green)' : 'var(--color-faint)',
                background: isActive ? 'var(--color-surface-2)' : 'transparent',
              }}>
                {label}
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentStep === 2 && (
            <button onClick={() => setCurrentStep(1)} style={navBtnStyle}>← Back</button>
          )}
          {currentStep === 2 && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                ...navBtnStyle,
                background: saveState === 'saved' ? 'var(--color-green-bg)' : saveState === 'error' ? 'var(--color-red-bg)' : 'var(--color-surface)',
                color: saveState === 'saved' ? 'var(--color-green)' : saveState === 'error' ? 'var(--color-red)' : 'var(--color-text)',
                borderColor: saveState === 'saved' ? 'var(--color-green)' : saveState === 'error' ? 'var(--color-red)' : 'var(--color-border-strong)',
              }}
            >
              {saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Failed — retry' : isSaving ? 'Saving…' : 'Save'}
            </button>
          )}
          {currentStep === 1 && (
            <button
              onClick={() => { if (table) setCurrentStep(2) }}
              disabled={!table}
              style={{ ...navBtnStyle, background: table ? 'var(--color-text)' : 'var(--color-surface-2)', color: table ? 'var(--color-bg)' : 'var(--color-faint)', borderColor: table ? 'var(--color-text)' : 'var(--color-surface-2)', cursor: table ? 'pointer' : 'not-allowed' }}
            >
              Next →
            </button>
          )}
          {currentStep === 2 && (
            <button onClick={() => setShowExport(true)} style={{ ...navBtnStyle, background: 'var(--color-blue)', color: 'var(--color-bg)', borderColor: 'var(--color-blue)' }}>
              ↓ Export
            </button>
          )}
        </div>
      </nav>

      {/* ── Screen 1: Data input ── */}
      {currentStep === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 580 }}>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-blue)' : 'var(--color-border-strong)'}`,
                borderRadius: 12,
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'var(--color-blue-bg)' : 'var(--color-surface)',
                transition: 'all .15s',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8, color: 'var(--color-muted)' }}>↑</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Drop a file here</div>
              <div style={{ fontSize: 11, color: 'var(--color-faint)' }}>CSV, TSV, or Excel (.xlsx)</div>
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-faint)', whiteSpace: 'nowrap' }}>or paste directly</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            {/* Paste textarea */}
            <textarea
              rows={7}
              placeholder="Paste CSV or tab-separated data here..."
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); if (e.target.value.trim()) { processText(e.target.value) } else { setTable(null) } }}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: '1px solid var(--color-border-strong)', borderRadius: 8, fontSize: 12,
                fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', background: 'var(--color-surface)', color: 'var(--color-text)',
                lineHeight: 1.6,
              }}
            />

            {/* Data preview */}
            {table && (
              <div style={{ marginTop: 20 }}>
                {/* Inference bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', background: 'var(--color-blue-bg)', borderRadius: 8, fontSize: 12, color: 'var(--color-text)' }}>
                  <span dangerouslySetInnerHTML={{ __html: `Looks like <b>${colTypes.some(t => t === 'date') ? 'a time series' : 'categorical data'}</b> — suggesting <b>${suggestedLabel} chart</b>` }} />
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--color-blue)', color: 'var(--color-bg)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>auto-detected</span>
                </div>

                {/* Stats */}
                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>
                  {table.colCount} cols · {table.rowCount} rows
                </div>

                {/* Preview table */}
                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface-2)' }}>
                        {table.headers.map((h, i) => (
                          <th key={i} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h || `Col ${i + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: ri < 4 && ri < table.rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: '6px 10px', color: 'var(--color-text)' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                      {table.rowCount > 5 && (
                        <tr>
                          <td colSpan={table.colCount} style={{ padding: '7px 10px', color: 'var(--color-faint)', fontSize: 10, textAlign: 'center' }}>
                            +{table.rowCount - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Use this button */}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setCurrentStep(2)}
                    style={{ padding: '9px 20px', background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Use this →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Screen 2: Customise ── */}
      {currentStep === 2 && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left panel */}
          <div style={{ width: 272, minWidth: 272, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* ── Section: Chart type ── */}
            <SectionHeader label="Chart type" open={openSections.type} onToggle={() => toggleSection('type')} />
            {openSections.type && (
              <div style={{ padding: '12px 14px 16px' }}>
                <input
                  type="text"
                  placeholder="Search chart types..."
                  value={typeSearch}
                  onChange={e => setTypeSearch(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', marginBottom: 10 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                  {CHART_TYPES.filter(ct => !typeSearch || ct.label.toLowerCase().includes(typeSearch.toLowerCase()) || ct.group.toLowerCase().includes(typeSearch.toLowerCase())).map(ct => (
                    <button
                      key={ct.id}
                      onClick={() => selectChartType(ct.id)}
                      title={`${ct.label} (${ct.group})`}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        padding: '7px 4px', borderRadius: 6, cursor: 'pointer',
                        border: chartType === ct.id ? '1.5px solid var(--color-blue)' : '1.5px solid transparent',
                        background: chartType === ct.id ? 'var(--color-blue-bg)' : 'var(--color-bg)',
                        color: chartType === ct.id ? 'var(--color-blue)' : 'var(--color-muted)',
                        fontSize: 9, fontWeight: 600, fontFamily: 'inherit',
                        transition: 'all .1s',
                        position: 'relative',
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: ct.icon }} style={{ display: 'flex', width: 16, height: 12 }} />
                      <span style={{ fontSize: 8.5, lineHeight: 1, textAlign: 'center' }}>{ct.label}</span>
                      {ct.id === suggestedType && (
                        <span style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, background: 'var(--color-blue)', borderRadius: '50%' }} />
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-faint)', marginTop: 8 }}>
                  <span style={{ display: 'inline-block', width: 5, height: 5, background: 'var(--color-blue)', borderRadius: '50%', marginRight: 4, verticalAlign: 'middle' }} />
                  auto-suggested for your data
                </div>
              </div>
            )}

            {/* ── Section: Data mapping ── */}
            <SectionHeader label="Data mapping" open={openSections.mapping} onToggle={() => toggleSection('mapping')} />
            {openSections.mapping && (
              <div style={{ padding: '12px 14px 16px' }}>
                {(ROLES[chartType] || []).map(role => (
                  <div key={role.key} style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 10, color: 'var(--color-muted)', marginBottom: 4, fontWeight: 600 }}>{role.label}</label>
                    <select
                      value={mappings[role.key] ?? -1}
                      onChange={e => setMappings(m => ({ ...m, [role.key]: +e.target.value }))}
                      style={{ width: '100%', padding: '7px 8px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value={-1}>— none —</option>
                      {(table?.headers || []).map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* ── Section: Visual style ── */}
            <SectionHeader label="Visual style" open={openSections.visual} onToggle={() => toggleSection('visual')} />
            {openSections.visual && (
              <div style={{ padding: '12px 14px 16px' }}>
                {/* Color swatches */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <FieldLabel>Primary color</FieldLabel>
                  <button
                    onClick={() => { setVis(v => ({ ...v, color: '#1D6EE8', opacity: 85, radius: 4, lineWidth: 2.5, pointSize: 4, barWidth: 'auto' })); setColorInput('#1D6EE8') }}
                    style={{ fontSize: 9, color: 'var(--color-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                  >Reset style</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {SWATCHES.map(c => (
                    <button key={c} onClick={() => { setVis(v => ({ ...v, color: c })); setColorInput(c) }} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: vis.color === c ? '2.5px solid var(--color-text)' : '2.5px solid transparent', cursor: 'pointer', transform: vis.color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all .1s' }} />
                  ))}
                  <input
                    type="text"
                    value={colorInput}
                    onChange={e => {
                      const v = e.target.value
                      setColorInput(v)
                      if (/^#[0-9A-Fa-f]{6}$/.test(v)) setVis(prev => ({ ...prev, color: v }))
                    }}
                    style={{ width: 70, padding: '4px 6px', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
                  />
                </div>

                {/* Opacity */}
                <FieldLabel>Opacity — {vis.opacity}%</FieldLabel>
                <input type="range" min={0} max={100} value={vis.opacity} onChange={e => setVis(v => ({ ...v, opacity: +e.target.value }))} style={{ width: '100%', marginBottom: 12, accentColor: 'var(--color-blue)' }} />

                {/* Corner radius — only for chart types that have rounded bars */}
                {caps.hasRadius && (
                  <>
                    <FieldLabel>Corner radius — {vis.radius}px</FieldLabel>
                    <input type="range" min={0} max={16} value={vis.radius} onChange={e => setVis(v => ({ ...v, radius: +e.target.value }))} style={{ width: '100%', marginBottom: 12, accentColor: 'var(--color-blue)' }} />
                  </>
                )}

                {/* Line width — only for line/area chart types */}
                {caps.hasLineWidth && (
                  <>
                    <FieldLabel>Line width — {vis.lineWidth ?? 2.5}</FieldLabel>
                    <input type="range" min={1} max={5} step={0.5} value={vis.lineWidth ?? 2.5} onChange={e => setVis(v => ({ ...v, lineWidth: +e.target.value }))} style={{ width: '100%', marginBottom: 12, accentColor: 'var(--color-blue)' }} />
                  </>
                )}

                {/* Point size — for scatter/line types */}
                {caps.hasPointSize && (
                  <>
                    <FieldLabel>Point size — {vis.pointSize ?? 4}</FieldLabel>
                    <input type="range" min={0} max={8} step={1} value={vis.pointSize ?? 4} onChange={e => setVis(v => ({ ...v, pointSize: +e.target.value }))} style={{ width: '100%', marginBottom: 12, accentColor: 'var(--color-blue)' }} />
                  </>
                )}

                {/* Bar width — for bar chart types */}
                {caps.hasBarWidth && (
                  <>
                    <FieldLabel>Bar width</FieldLabel>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                      {(['narrow', 'auto', 'wide'] as const).map(bw => (
                        <button key={bw} onClick={() => setVis(v => ({ ...v, barWidth: bw }))} style={{ flex: 1, padding: '5px 0', fontSize: 9, fontWeight: 600, borderRadius: 5, border: (vis.barWidth ?? 'auto') === bw ? '1.5px solid var(--color-blue)' : '1.5px solid var(--color-border)', background: (vis.barWidth ?? 'auto') === bw ? 'var(--color-blue-bg)' : 'var(--color-bg)', color: (vis.barWidth ?? 'auto') === bw ? 'var(--color-blue)' : 'var(--color-muted)', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                          {bw}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Background */}
                <FieldLabel>Background</FieldLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['white', 'offwhite', 'dark', 'transparent'] as const).map(b => (
                    <button key={b} onClick={() => setVis(v => ({ ...v, bg: b }))} style={{ flex: 1, padding: '5px 0', fontSize: 9, fontWeight: 600, borderRadius: 5, border: vis.bg === b ? '1.5px solid var(--color-blue)' : '1.5px solid var(--color-border)', background: vis.bg === b ? 'var(--color-blue-bg)' : 'var(--color-bg)', color: vis.bg === b ? 'var(--color-blue)' : 'var(--color-muted)', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                      {b === 'offwhite' ? 'Off-wh.' : b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Section: Axes ── */}
            <SectionHeader label="Axes" open={openSections.axes} onToggle={() => toggleSection('axes')} />
            {openSections.axes && (
              <div style={{ padding: '12px 14px 16px' }}>
                <FieldLabel>X axis label</FieldLabel>
                <input value={vis.xLabel} onChange={e => setVis(v => ({ ...v, xLabel: e.target.value }))} placeholder="Label..." style={inputStyle} />

                <FieldLabel>Y axis label</FieldLabel>
                <input value={vis.yLabel} onChange={e => setVis(v => ({ ...v, yLabel: e.target.value }))} placeholder="Label..." style={{ ...inputStyle, marginBottom: 12 }} />

                <FieldLabel>Tick format</FieldLabel>
                <select value={vis.tickFormat} onChange={e => setVis(v => ({ ...v, tickFormat: e.target.value as VisualConfig['tickFormat'] }))} style={{ ...inputStyle, marginBottom: 12 }}>
                  <option value="auto">Auto</option>
                  <option value="kmb">K, M, B</option>
                  <option value="inr">₹ INR</option>
                  <option value="usd">$ USD</option>
                  <option value="pct">%</option>
                </select>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {caps.hasGrid && <ToggleBtn active={vis.showGrid} onClick={() => setVis(v => ({ ...v, showGrid: !v.showGrid }))}>Grid</ToggleBtn>}
                  {caps.hasSmooth && <ToggleBtn active={vis.smooth} onClick={() => setVis(v => ({ ...v, smooth: !v.smooth }))}>Smooth</ToggleBtn>}
                  {caps.hasLog && <ToggleBtn active={vis.logScale} onClick={() => setVis(v => ({ ...v, logScale: !v.logScale }))}>Log</ToggleBtn>}
                </div>
              </div>
            )}

            {/* ── Section: Annotations ── */}
            <SectionHeader label="Annotations" open={openSections.annotations} onToggle={() => toggleSection('annotations')} />
            {openSections.annotations && (
              <div style={{ padding: '12px 14px 16px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <ToggleBtn active={vis.showLabels} onClick={() => setVis(v => ({ ...v, showLabels: !v.showLabels }))}>Data labels</ToggleBtn>
                  <ToggleBtn active={vis.showAvgLine} onClick={() => setVis(v => ({ ...v, showAvgLine: !v.showAvgLine }))}>Avg line</ToggleBtn>
                  <ToggleBtn active={vis.showLegend} onClick={() => setVis(v => ({ ...v, showLegend: !v.showLegend }))}>Legend</ToggleBtn>
                </div>
              </div>
            )}

            {/* ── Section: Title & text ── */}
            <SectionHeader label="Title & text" open={openSections.text} onToggle={() => toggleSection('text')} />
            {openSections.text && (
              <div style={{ padding: '12px 14px 16px' }}>
                <FieldLabel>Title</FieldLabel>
                <input value={chartTitle} onChange={e => setChartTitle(e.target.value)} placeholder="Chart title..." style={inputStyle} />

                <FieldLabel>Subtitle</FieldLabel>
                <input value={chartSubtitle} onChange={e => setChartSubtitle(e.target.value)} placeholder="Subtitle..." style={inputStyle} />

                <FieldLabel>Source</FieldLabel>
                <input value={chartSource} onChange={e => setChartSource(e.target.value)} placeholder="Source: ..." style={{ ...inputStyle, marginBottom: 12 }} />

                <ToggleBtn active={incWatermark} onClick={() => setIncWatermark(w => !w)}>Plot watermark</ToggleBtn>
              </div>
            )}
          </div>

          {/* Right preview */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, overflowY: 'auto', background: 'var(--color-bg)' }}>
            <div style={{ width: '100%', maxWidth: 680 }}>
              {/* Chart card */}
              <div style={{ background: cardBg, borderRadius: 12, padding: 24, boxShadow: '0 4px 32px rgba(0,0,0,.4)', color: cardText }}>
                {chartTitle && (
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: chartSubtitle ? 4 : 12, color: cardText }}>{chartTitle}</div>
                )}
                {chartSubtitle && (
                  <div style={{ fontSize: 12, color: vis.bg === 'dark' ? '#aaa' : '#888', marginBottom: 12 }}>{chartSubtitle}</div>
                )}
                <div style={{ height: 340, position: 'relative' }}>
                  <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                </div>
                {chartSource && (
                  <div style={{ fontSize: 10, color: vis.bg === 'dark' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)', marginTop: 8 }}>{chartSource}</div>
                )}
                {incWatermark && (
                  <div style={{ fontSize: 9, color: vis.bg === 'dark' ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.18)', marginTop: 4, textAlign: 'right' }}>Made with Plot · plot.so</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Export modal ── */}
      {showExport && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowExport(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 28, width: 400, fontFamily: 'inherit', boxShadow: '0 20px 60px rgba(0,0,0,.6)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--color-text)' }}>Export chart</div>

            {/* Format */}
            <FieldLabel>Format</FieldLabel>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['png', 'svg'] as const).map(f => (
                <button key={f} onClick={() => setExpFormat(f)} style={{ ...expBtnStyle, ...(expFormat === f ? expBtnActive : {}) }}>{f.toUpperCase()}</button>
              ))}
            </div>

            {/* Resolution — hide for SVG */}
            {expFormat === 'png' && (
              <>
                <FieldLabel>Resolution</FieldLabel>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {[1, 2, 3].map(r => (
                    <button key={r} onClick={() => setExpRes(r)} style={{ ...expBtnStyle, ...(expRes === r ? expBtnActive : {}) }}>{r}×</button>
                  ))}
                </div>
              </>
            )}

            {/* Background */}
            <FieldLabel>Background</FieldLabel>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['white', 'offwhite', 'dark', 'transparent'] as const).map(b => (
                <button key={b} onClick={() => setExpBg(b)} style={{ ...expBtnStyle, ...(expBg === b ? expBtnActive : {}), fontSize: 9 }}>
                  {b === 'offwhite' ? 'Off-wh.' : b}
                </button>
              ))}
            </div>

            {/* Include */}
            <FieldLabel>Include in export</FieldLabel>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <ToggleBtn active={incTitle} onClick={() => setIncTitle(t => !t)}>Title & text</ToggleBtn>
              <ToggleBtn active={incWatermark} onClick={() => setIncWatermark(w => !w)}>Watermark</ToggleBtn>
            </div>

            {/* Preview label */}
            <div style={{ fontSize: 10, color: 'var(--color-muted)', background: 'var(--color-surface-2)', borderRadius: 6, padding: '7px 10px', marginBottom: 20, fontFamily: 'monospace' }}>
              {expFormat.toUpperCase()} · {expRes}× ({1200 * expRes}×{800 * expRes}px) · {expBg} bg · title {incTitle ? 'on' : 'off'}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExport(false)} style={navBtnStyle}>Cancel</button>
              {expFormat === 'svg' && (
                <button onClick={downloadSVG} style={{ ...navBtnStyle, background: 'var(--color-text)', color: 'var(--color-bg)', borderColor: 'var(--color-text)' }}>↓ Download SVG</button>
              )}
              {expFormat === 'png' && (
                <button onClick={downloadPNG} style={{ ...navBtnStyle, background: 'var(--color-blue)', color: 'var(--color-bg)', borderColor: 'var(--color-blue)' }}>↓ Download PNG</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
        fontFamily: 'inherit', textAlign: 'left',
      }}
    >
      {label}
      <span style={{ fontSize: 10, color: 'var(--color-faint)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', display: 'inline-block' }}>▾</span>
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 5, marginTop: 2 }}>{children}</div>
  )
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px', fontSize: 10, fontWeight: 600, borderRadius: 5, cursor: 'pointer',
        border: `1.5px solid ${active ? 'var(--color-blue)' : 'var(--color-border)'}`,
        background: active ? 'var(--color-blue-bg)' : 'var(--color-bg)',
        color: active ? 'var(--color-blue)' : 'var(--color-muted)',
        fontFamily: 'inherit',
        transition: 'all .1s',
      }}
    >
      {children}
    </button>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 7,
  border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', color: 'var(--color-text)',
  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .1s',
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '7px 8px', border: '1px solid var(--color-border)',
  borderRadius: 6, fontSize: 11, fontFamily: 'inherit',
  background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', marginBottom: 10,
}

const expBtnStyle: React.CSSProperties = {
  flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600, borderRadius: 6,
  border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-muted)',
  cursor: 'pointer', fontFamily: 'inherit',
}

const expBtnActive: React.CSSProperties = {
  border: '1.5px solid var(--color-blue)', background: 'var(--color-blue-bg)', color: 'var(--color-blue)',
}
