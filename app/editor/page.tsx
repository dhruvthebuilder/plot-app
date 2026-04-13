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
    const off = document.createElement('canvas')
    off.width = w; off.height = h
    const ctx = off.getContext('2d')!
    if (expBg !== 'transparent') { ctx.fillStyle = bgColors[expBg] || '#fff'; ctx.fillRect(0, 0, w, h) }
    ctx.drawImage(canvas, 0, 0, w, h)
    if (incTitle && chartTitle) {
      ctx.save()
      ctx.fillStyle = expBg === 'dark' ? '#fff' : '#111'
      ctx.font = `bold ${20 * scale}px Helvetica,Arial,sans-serif`
      ctx.fillText(chartTitle, 20 * scale, 28 * scale)
      if (chartSubtitle) {
        ctx.font = `${12 * scale}px Helvetica,Arial,sans-serif`
        ctx.fillStyle = expBg === 'dark' ? '#aaa' : '#888'
        ctx.fillText(chartSubtitle, 20 * scale, 44 * scale)
      }
      ctx.restore()
    }
    if (incTitle && chartSource) {
      ctx.save()
      ctx.font = `${10 * scale}px Helvetica,Arial,sans-serif`
      ctx.fillStyle = expBg === 'dark' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.35)'
      ctx.fillText(chartSource, 20 * scale, h - 16 * scale)
      ctx.restore()
    }
    if (incWatermark) {
      ctx.save()
      ctx.font = `${9 * scale}px Helvetica,Arial,sans-serif`
      ctx.fillStyle = expBg === 'dark' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.18)'
      ctx.fillText('Made with Plot · plot.so', w - 160 * scale, h - 10 * scale)
      ctx.restore()
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
    const titleLine = incTitle && chartTitle
      ? `<text x="16" y="24" font-family="Helvetica,Arial,sans-serif" font-size="18" font-weight="bold" fill="${expBg === 'dark' ? '#fff' : '#111'}">${chartTitle}</text>` +
        (chartSubtitle ? `<text x="16" y="40" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="${expBg === 'dark' ? '#aaa' : '#888'}">${chartSubtitle}</text>` : '')
      : ''
    const bgFill = expBg === 'dark' ? '#111' : expBg === 'offwhite' ? '#F7F3EC' : expBg === 'transparent' ? 'none' : '#fff'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
  <rect width="${canvas.width}" height="${canvas.height}" fill="${bgFill}"/>
  ${titleLine}
  <image href="${base64}" x="0" y="0" width="${canvas.width}" height="${canvas.height}"/>
  ${incWatermark ? `<text x="${canvas.width - 120}" y="${canvas.height - 8}" font-family="Helvetica,Arial,sans-serif" font-size="9" fill="${expBg === 'dark' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)'}">Made with Plot</text>` : ''}
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

  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', minHeight: '100vh', background: '#F7F7F7', display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 28, height: 28, background: '#111', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="8" width="3" height="7" fill="white" rx="1" />
              <rect x="6" y="4" width="3" height="11" fill="white" rx="1" />
              <rect x="11" y="1" width="3" height="14" fill="white" rx="1" />
              <circle cx="2.5" cy="7" r="1.5" fill="#1D6EE8" />
              <circle cx="7.5" cy="3" r="1.5" fill="#1D6EE8" />
              <circle cx="12.5" cy="0.5" r="1.5" fill="#1D6EE8" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em' }}>Plot</span>
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
                color: isActive ? '#111' : isDone ? '#10B981' : '#AAA',
                background: isActive ? '#F0F0F0' : 'transparent',
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
                background: saveState === 'saved' ? '#F0FDF4' : saveState === 'error' ? '#FEF2F2' : '#fff',
                color: saveState === 'saved' ? '#16A34A' : saveState === 'error' ? '#E24B4A' : '#111',
                borderColor: saveState === 'saved' ? '#BBF7D0' : saveState === 'error' ? '#FCA5A5' : '#D8D8D8',
              }}
            >
              {saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Failed — retry' : isSaving ? 'Saving…' : 'Save'}
            </button>
          )}
          {currentStep === 1 && (
            <button
              onClick={() => { if (table) setCurrentStep(2) }}
              disabled={!table}
              style={{ ...navBtnStyle, background: table ? '#111' : '#E8E8E8', color: table ? '#fff' : '#AAA', borderColor: table ? '#111' : '#E8E8E8', cursor: table ? 'pointer' : 'not-allowed' }}
            >
              Next →
            </button>
          )}
          {currentStep === 2 && (
            <button onClick={() => setShowExport(true)} style={{ ...navBtnStyle, background: '#1D6EE8', color: '#fff', borderColor: '#1D6EE8' }}>
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
                border: `2px dashed ${dragOver ? '#1D6EE8' : '#D8D8D8'}`,
                borderRadius: 12,
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? '#EEF4FF' : '#fff',
                transition: 'all .15s',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8, color: '#888' }}>↑</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>Drop a file here</div>
              <div style={{ fontSize: 11, color: '#AAA' }}>CSV, TSV, or Excel (.xlsx)</div>
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
              <span style={{ fontSize: 11, color: '#AAA', whiteSpace: 'nowrap' }}>or paste directly</span>
              <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
            </div>

            {/* Paste textarea */}
            <textarea
              rows={7}
              placeholder="Paste CSV or tab-separated data here..."
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); if (e.target.value.trim()) { processText(e.target.value) } else { setTable(null) } }}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: '1px solid #D8D8D8', borderRadius: 8, fontSize: 12,
                fontFamily: 'Helvetica, Arial, sans-serif', resize: 'vertical',
                outline: 'none', background: '#fff', color: '#111',
                lineHeight: 1.6,
              }}
            />

            {/* Data preview */}
            {table && (
              <div style={{ marginTop: 20 }}>
                {/* Inference bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', background: '#F0F7FF', borderRadius: 8, fontSize: 12, color: '#444' }}>
                  <span dangerouslySetInnerHTML={{ __html: `Looks like <b>${colTypes[0] === 'date' ? 'a time series' : 'categorical data'}</b> — suggesting <b>${suggestedLabel} chart</b>` }} />
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: '#1D6EE8', color: '#fff', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>auto-detected</span>
                </div>

                {/* Stats */}
                <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                  {table.colCount} cols · {table.rowCount} rows
                </div>

                {/* Preview table */}
                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E8E8E8' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F7F7F7' }}>
                        {table.headers.map((h, i) => (
                          <th key={i} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #E8E8E8', whiteSpace: 'nowrap' }}>{h || `Col ${i + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: ri < 4 && ri < table.rows.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: '6px 10px', color: '#333' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                      {table.rowCount > 5 && (
                        <tr>
                          <td colSpan={table.colCount} style={{ padding: '7px 10px', color: '#AAA', fontSize: 10, textAlign: 'center' }}>
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
                    style={{ padding: '9px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Helvetica, Arial, sans-serif' }}
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
          <div style={{ width: 272, minWidth: 272, background: '#fff', borderRight: '1px solid #E8E8E8', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* ── Section: Chart type ── */}
            <SectionHeader label="Chart type" open={openSections.type} onToggle={() => toggleSection('type')} />
            {openSections.type && (
              <div style={{ padding: '12px 14px 16px' }}>
                <input
                  type="text"
                  placeholder="Search chart types..."
                  value={typeSearch}
                  onChange={e => setTypeSearch(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 11, fontFamily: 'Helvetica, Arial, sans-serif', background: '#F7F7F7', outline: 'none', marginBottom: 10 }}
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
                        border: chartType === ct.id ? '1.5px solid #1D6EE8' : '1.5px solid transparent',
                        background: chartType === ct.id ? '#EEF4FF' : '#F7F7F7',
                        color: chartType === ct.id ? '#1D6EE8' : '#666',
                        fontSize: 9, fontWeight: 600, fontFamily: 'Helvetica, Arial, sans-serif',
                        transition: 'all .1s',
                        position: 'relative',
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: ct.icon }} style={{ display: 'flex', width: 16, height: 12 }} />
                      <span style={{ fontSize: 8.5, lineHeight: 1, textAlign: 'center' }}>{ct.label}</span>
                      {ct.id === suggestedType && (
                        <span style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, background: '#1D6EE8', borderRadius: '50%' }} />
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: '#AAA', marginTop: 8 }}>
                  <span style={{ display: 'inline-block', width: 5, height: 5, background: '#1D6EE8', borderRadius: '50%', marginRight: 4, verticalAlign: 'middle' }} />
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
                    <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4, fontWeight: 600 }}>{role.label}</label>
                    <select
                      value={mappings[role.key] ?? -1}
                      onChange={e => setMappings(m => ({ ...m, [role.key]: +e.target.value }))}
                      style={{ width: '100%', padding: '7px 8px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 11, fontFamily: 'Helvetica, Arial, sans-serif', background: '#fff', color: '#111', outline: 'none', cursor: 'pointer' }}
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
                <FieldLabel>Primary color</FieldLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {SWATCHES.map(c => (
                    <button key={c} onClick={() => setVis(v => ({ ...v, color: c }))} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: vis.color === c ? '2.5px solid #111' : '2.5px solid transparent', cursor: 'pointer', transform: vis.color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all .1s' }} />
                  ))}
                  <input
                    type="text"
                    value={vis.color}
                    onChange={e => setVis(v => ({ ...v, color: e.target.value }))}
                    style={{ width: 70, padding: '4px 6px', border: '1px solid #E0E0E0', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', background: '#fff', outline: 'none' }}
                  />
                </div>

                {/* Opacity */}
                <FieldLabel>Opacity — {vis.opacity}%</FieldLabel>
                <input type="range" min={10} max={100} value={vis.opacity} onChange={e => setVis(v => ({ ...v, opacity: +e.target.value }))} style={{ width: '100%', marginBottom: 12, accentColor: '#1D6EE8' }} />

                {/* Corner radius */}
                <FieldLabel>Corner radius — {vis.radius}px</FieldLabel>
                <input type="range" min={0} max={16} value={vis.radius} onChange={e => setVis(v => ({ ...v, radius: +e.target.value }))} style={{ width: '100%', marginBottom: 12, accentColor: '#1D6EE8' }} />

                {/* Background */}
                <FieldLabel>Background</FieldLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['white', 'offwhite', 'dark', 'transparent'] as const).map(b => (
                    <button key={b} onClick={() => setVis(v => ({ ...v, bg: b }))} style={{ flex: 1, padding: '5px 0', fontSize: 9, fontWeight: 600, borderRadius: 5, border: vis.bg === b ? '1.5px solid #1D6EE8' : '1.5px solid #E0E0E0', background: vis.bg === b ? '#EEF4FF' : '#fff', color: vis.bg === b ? '#1D6EE8' : '#666', cursor: 'pointer', fontFamily: 'Helvetica, Arial, sans-serif', textTransform: 'capitalize' }}>
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

                <div style={{ display: 'flex', gap: 4 }}>
                  <ToggleBtn active={vis.showGrid} onClick={() => setVis(v => ({ ...v, showGrid: !v.showGrid }))}>Grid</ToggleBtn>
                  <ToggleBtn active={vis.smooth} onClick={() => setVis(v => ({ ...v, smooth: !v.smooth }))}>Smooth</ToggleBtn>
                  <ToggleBtn active={vis.logScale} onClick={() => setVis(v => ({ ...v, logScale: !v.logScale }))}>Log</ToggleBtn>
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, overflowY: 'auto', background: '#F0F0F0' }}>
            <div style={{ width: '100%', maxWidth: 680 }}>
              {/* Chart card */}
              <div style={{ background: cardBg, borderRadius: 12, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,.08)', color: cardText }}>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, fontFamily: 'Helvetica, Arial, sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Export chart</div>

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
            <div style={{ fontSize: 10, color: '#888', background: '#F7F7F7', borderRadius: 6, padding: '7px 10px', marginBottom: 20, fontFamily: 'monospace' }}>
              {expFormat.toUpperCase()} · {expRes}× ({1200 * expRes}×{800 * expRes}px) · {expBg} bg · title {incTitle ? 'on' : 'off'}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExport(false)} style={navBtnStyle}>Cancel</button>
              {expFormat === 'svg' && (
                <button onClick={downloadSVG} style={{ ...navBtnStyle, background: '#111', color: '#fff', borderColor: '#111' }}>↓ Download SVG</button>
              )}
              {expFormat === 'png' && (
                <button onClick={downloadPNG} style={{ ...navBtnStyle, background: '#1D6EE8', color: '#fff', borderColor: '#1D6EE8' }}>↓ Download PNG</button>
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
        padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #F0F0F0',
        cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#333',
        fontFamily: 'Helvetica, Arial, sans-serif', textAlign: 'left',
      }}
    >
      {label}
      <span style={{ fontSize: 10, color: '#AAA', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', display: 'inline-block' }}>▾</span>
    </button>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 5, marginTop: 2 }}>{children}</div>
  )
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px', fontSize: 10, fontWeight: 600, borderRadius: 5, cursor: 'pointer',
        border: `1.5px solid ${active ? '#1D6EE8' : '#E0E0E0'}`,
        background: active ? '#EEF4FF' : '#fff',
        color: active ? '#1D6EE8' : '#666',
        fontFamily: 'Helvetica, Arial, sans-serif',
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
  border: '1px solid #D8D8D8', background: '#fff', color: '#333',
  cursor: 'pointer', fontFamily: 'Helvetica, Arial, sans-serif', transition: 'all .1s',
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '7px 8px', border: '1px solid #E0E0E0',
  borderRadius: 6, fontSize: 11, fontFamily: 'Helvetica, Arial, sans-serif',
  background: '#fff', color: '#111', outline: 'none', marginBottom: 10,
}

const expBtnStyle: React.CSSProperties = {
  flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600, borderRadius: 6,
  border: '1.5px solid #E0E0E0', background: '#fff', color: '#555',
  cursor: 'pointer', fontFamily: 'Helvetica, Arial, sans-serif',
}

const expBtnActive: React.CSSProperties = {
  border: '1.5px solid #1D6EE8', background: '#EEF4FF', color: '#1D6EE8',
}
