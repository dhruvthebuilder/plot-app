'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Chart as ChartJS, registerables } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  parseRawText,
  detectColumnType,
  suggestChartType,
  buildChartData,
  computeStats,
  mapToChartJSType,
  CHART_TYPES,
  CHART_COLUMN_ROLES,
  UNSUPPORTED_CHART_TYPES,
  type ParsedTable,
  type ColumnType,
  type VisualConfig,
} from '@/lib/chartEngine'

ChartJS.register(...registerables)

const COLOR_PALETTE = ['#1D6EE8', '#111111', '#F0A500', '#10B981', '#E24B4A', '#7C3AED']

// Group CHART_TYPES by group for the <optgroup> select
const GROUPED_CHART_TYPES = CHART_TYPES.reduce<Record<string, typeof CHART_TYPES[number][]>>(
  (acc, ct) => {
    if (!acc[ct.group]) acc[ct.group] = []
    acc[ct.group].push(ct)
    return acc
  },
  {}
)

function EditorContent() {
  const router = useRouter()

  // ── Step 1: Data ─────────────────────────────────────────────────────────
  const [parsedTable, setParsedTable] = useState<ParsedTable | null>(null)
  const [isDragging, setIsDragging]   = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [dataError, setDataError]     = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Step 2: Configuration ────────────────────────────────────────────────
  const [columnTypes, setColumnTypes]             = useState<ColumnType[]>([])
  const [chartType, setChartType]                 = useState('')
  const [suggestedType, setSuggestedType]         = useState('')
  const [columnAssignments, setColumnAssignments] = useState<Record<number, number>>({})

  // ── Visual config ────────────────────────────────────────────────────────
  const [color, setColor]               = useState('#1D6EE8')
  const [opacity, setOpacity]           = useState(85)
  const [showGrid, setShowGrid]         = useState(true)
  const [smooth, setSmooth]             = useState(false)
  const [cornerRadius, setCornerRadius] = useState(4)
  const [chartTitle, setChartTitle]     = useState('')

  // ── Export ───────────────────────────────────────────────────────────────
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportRes, setExportRes]             = useState<1 | 2 | 3>(1)
  const [exportBg, setExportBg]               = useState<'white' | 'offwhite' | 'dark' | 'transparent'>('white')
  const [isSaving, setIsSaving]               = useState(false)
  const [saveState, setSaveState]             = useState<'idle' | 'saved' | 'error'>('idle')

  const chartRef = useRef<ChartJS | null>(null)

  // ── Paste handler (window-level, skip if typing in input/textarea) ────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const active = document.activeElement
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return
      const text = e.clipboardData?.getData('text/plain')
      if (text?.trim()) processRawText(text)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Core data processing ─────────────────────────────────────────────────
  const processRawText = useCallback((raw: string) => {
    setIsLoading(true)
    setDataError(null)
    try {
      const table = parseRawText(raw)
      handleDataLoaded(table)
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Could not parse data')
    }
    setIsLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDataLoaded = useCallback((table: ParsedTable) => {
    setParsedTable(table)
    setDataError(null)

    const types = table.headers.map((_, i) =>
      detectColumnType(table.rows.map(row => row[i] || ''))
    )
    setColumnTypes(types)

    const suggested = suggestChartType(table, types)
    setSuggestedType(suggested)
    setChartType(suggested)

    const roles = CHART_COLUMN_ROLES[suggested] || []
    const assignments: Record<number, number> = {}
    roles.forEach((_, i) => { assignments[i] = i < table.colCount ? i : -1 })
    setColumnAssignments(assignments)
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setDataError(null)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const reader = new FileReader()
      reader.onload = e => processRawText(e.target?.result as string)
      reader.readAsText(file)
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const XLSX = await import('xlsx')
        const reader = new FileReader()
        reader.onload = e => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const csv = XLSX.utils.sheet_to_csv(sheet)
          processRawText(csv)
        }
        reader.readAsArrayBuffer(file)
      } catch {
        setDataError('Failed to parse Excel file')
        setIsLoading(false)
      }
    } else {
      setDataError('Unsupported file type. Use CSV, TSV, TXT, or XLSX.')
      setIsLoading(false)
    }
  }, [processRawText])

  const handleChartTypeChange = useCallback((newType: string) => {
    setChartType(newType)
    if (!parsedTable) return
    const roles = CHART_COLUMN_ROLES[newType] || []
    const assignments: Record<number, number> = {}
    roles.forEach((_, i) => { assignments[i] = i < parsedTable.colCount ? i : -1 })
    setColumnAssignments(assignments)
  }, [parsedTable])

  const handleReset = useCallback(() => {
    setParsedTable(null)
    setColumnTypes([])
    setChartType('')
    setSuggestedType('')
    setColumnAssignments({})
    setDataError(null)
    setChartTitle('')
  }, [])

  // ── Chart config (memoised — no effects needed) ───────────────────────────
  const chartConfig = useMemo(() => {
    if (!parsedTable || !chartType || UNSUPPORTED_CHART_TYPES.has(chartType)) return null
    const config: VisualConfig = { color, opacity, showGrid, smooth, cornerRadius }
    return buildChartData(parsedTable, columnTypes, chartType, columnAssignments, config)
  }, [parsedTable, columnTypes, chartType, columnAssignments, color, opacity, showGrid, smooth, cornerRadius])

  // Stats derived from Y-axis column assignment
  const stats = useMemo(() => {
    if (!parsedTable || !chartType) return null
    const roleIndex = chartType === 'histogram' ? 0 : 1
    const colIndex  = columnAssignments[roleIndex]
    if (colIndex === undefined || colIndex === -1) return null
    const values = parsedTable.rows
      .map(row => parseFloat((row[colIndex] ?? '').replace(/,/g, '').trim()))
      .filter(n => !isNaN(n))
    return computeStats(values)
  }, [parsedTable, chartType, columnAssignments])

  // Key forces Chart recreation on type change
  const chartKey = chartType

  // ── Export ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!parsedTable || !chartType) return
    setIsSaving(true)
    setSaveState('idle')
    try {
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chartTitle || 'Untitled chart',
          chart_type: chartType,
          raw_data: '',
          data_json: { headers: parsedTable.headers, rows: parsedTable.rows.slice(0, 5) },
          config: { color, opacity, showGrid, smooth, cornerRadius },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1800)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2500)
    } finally {
      setIsSaving(false)
    }
  }, [parsedTable, chartType, chartTitle, color, opacity, showGrid, smooth, cornerRadius])

  const handleExportPNG = useCallback(() => {
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
      ctx.fillStyle = exportBg === 'white' ? '#FFFFFF' : exportBg === 'offwhite' ? '#F7F3EC' : '#111111'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h)
    if (chartTitle) {
      ctx.save()
      ctx.fillStyle = exportBg === 'dark' ? '#FFFFFF' : '#111111'
      ctx.font = `bold ${18 * scale}px Syne, sans-serif`
      ctx.fillText(chartTitle, 20 * scale, 26 * scale)
      ctx.restore()
    }
    ctx.save()
    ctx.font = `${9 * scale}px "IBM Plex Mono", monospace`
    ctx.fillStyle = exportBg === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
    ctx.fillText('Made with Plot · plot.so', 16 * scale, h - 10 * scale)
    ctx.restore()
    const filename = `${(chartTitle || 'chart').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}.png`
    off.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = filename
      a.href = url
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
    setShowExportModal(false)
  }, [chartRef, exportRes, exportBg, chartTitle])

  const showStep3 = !!parsedTable && !!chartType

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="bg-surface border-b border-border h-[52px] flex items-center justify-between px-6 sticky top-0 z-50 flex-shrink-0">
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
          {showStep3 && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'text-[13px] font-medium px-4 py-[7px] rounded-[8px] border transition-all',
                saveState === 'saved'
                  ? 'border-green bg-green-bg text-green'
                  : saveState === 'error'
                  ? 'border-[#E24B4A] bg-[#FEF2F2] text-[#E24B4A]'
                  : 'border-border-strong text-text hover:bg-bg hover:border-text'
              )}
            >
              {saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Failed — retry' : isSaving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </nav>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 py-10 px-6 overflow-auto">
        <div className="max-w-[860px] mx-auto flex flex-col gap-10">

          {/* ══ STEP 1: DATA INPUT ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-[22px] font-bold tracking-[-0.02em]">
                Let&apos;s create your chart
              </h1>
              {parsedTable && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-7 h-7 bg-surface border border-border rounded-[6px] flex items-center justify-center text-[13px] text-muted hover:text-text hover:border-border-strong transition-all"
                  title="Reset"
                >
                  ✕
                </button>
              )}
            </div>

            {!parsedTable ? (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragging(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handleFileUpload(file)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full h-[160px] rounded-[8px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                    isDragging
                      ? 'border-blue bg-blue-bg'
                      : isLoading
                      ? 'border-border bg-[#F5F0EB]'
                      : dataError
                      ? 'border-[#E24B4A] bg-[#FEF2F2]'
                      : 'border-[#C8C8C8] bg-[#F5F0EB] hover:border-blue hover:bg-blue-bg'
                  )}
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
                      <span className="font-mono text-[11px] text-muted">Reading file…</span>
                    </div>
                  ) : (
                    <span className="font-sans text-[15px] font-medium text-muted text-center px-6">
                      Ctrl V or Upload a file by clicking here
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ''
                  }}
                />
                {dataError && (
                  <p className="mt-2 font-mono text-[11px] text-[#E24B4A]">{dataError}</p>
                )}
                <p className="mt-2 font-mono text-[10px] text-faint">
                  Accepts CSV, TSV, TXT, or Excel (.xlsx) — paste with Ctrl V from anywhere
                </p>
              </>
            ) : (
              /* Data preview table */
              <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    {parsedTable.rowCount - 1} rows · {parsedTable.colCount} columns
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="font-mono text-[10px] text-blue hover:text-blue-dark transition-colors"
                  >
                    Change data →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {parsedTable.headers.map((h, i) => (
                          <th
                            key={i}
                            className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted px-4 py-2 text-left border-b border-border bg-bg"
                          >
                            {h || `Column ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTable.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 1 ? 'bg-bg' : ''}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="font-mono text-[11px] text-text px-4 py-[7px] border-b border-border last:border-b-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedTable.rows.length > 5 && (
                  <p className="font-mono text-[10px] text-muted px-4 py-2 border-t border-border">
                    … and {parsedTable.rows.length - 5} more rows
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ══ STEP 2: CUSTOMISE ═══════════════════════════════════════════ */}
          {parsedTable && (
            <section className="reveal-section">
              <h2 className="text-[18px] font-bold tracking-[-0.02em] mb-4">Customise</h2>

              <div className="grid grid-cols-2 gap-5">
                {/* Left: Column types */}
                <div className="bg-surface border border-border rounded-[8px] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-3">
                    Select Column Types
                  </div>
                  {parsedTable.headers.map((header, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="font-mono text-[12px] text-text">{header || `Column ${i + 1}`}</span>
                      <select
                        value={columnTypes[i] || 'text'}
                        onChange={e => {
                          const updated = [...columnTypes]
                          updated[i] = e.target.value as ColumnType
                          setColumnTypes(updated)
                        }}
                        className="font-mono text-[11px] px-2 py-1 border border-border rounded-[6px] bg-bg text-text outline-none focus:border-blue cursor-pointer"
                      >
                        <option value="date">Date</option>
                        <option value="integer">Integer</option>
                        <option value="decimal">Decimal</option>
                        <option value="text">Text</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Right: Chart specifications */}
                <div className="bg-surface border border-border rounded-[8px] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-3">
                    Select Chart Specifications
                  </div>

                  {/* Chart type row */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-text">Chart Type</span>
                      {suggestedType === chartType && (
                        <span className="font-mono text-[9px] bg-blue-bg text-blue-dark px-[6px] py-[2px] rounded-[4px]">
                          auto-detected
                        </span>
                      )}
                    </div>
                    <select
                      value={chartType}
                      onChange={e => handleChartTypeChange(e.target.value)}
                      className="font-mono text-[11px] px-2 py-1 border border-border rounded-[6px] bg-bg text-text outline-none focus:border-blue cursor-pointer max-w-[180px]"
                    >
                      {Object.entries(GROUPED_CHART_TYPES).map(([group, types]) => (
                        <optgroup key={group} label={group}>
                          {types.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Column assignment rows */}
                  {(CHART_COLUMN_ROLES[chartType] || []).map((role, i) => {
                    const isOptional = role.includes('(opt)')
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className={cn('font-mono text-[11px]', isOptional ? 'text-muted' : 'text-text')}>
                          {role}
                        </span>
                        <select
                          value={columnAssignments[i] ?? -1}
                          onChange={e => setColumnAssignments(prev => ({ ...prev, [i]: Number(e.target.value) }))}
                          className="font-mono text-[11px] px-2 py-1 border border-border rounded-[6px] bg-bg text-text outline-none focus:border-blue cursor-pointer max-w-[160px]"
                        >
                          {isOptional && <option value={-1}>— none —</option>}
                          {parsedTable.headers.map((h, ci) => (
                            <option key={ci} value={ci}>{h || `Column ${ci + 1}`}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ══ STEP 3: PREVIEW ═════════════════════════════════════════════ */}
          {showStep3 && (
            <section className="reveal-section pb-20">
              <h2 className="text-[18px] font-bold tracking-[-0.02em] mb-4">Preview</h2>

              {/* Stats strip */}
              {stats && (
                <div className="grid grid-cols-3 gap-[10px] mb-4">
                  {[
                    { label: 'Total', value: stats.total },
                    { label: 'Peak',  value: stats.peak },
                    { label: 'Avg',   value: stats.avg },
                  ].map(s => (
                    <div key={s.label} className="bg-surface border border-border rounded-[8px] px-[14px] py-[10px]">
                      <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted mb-1">{s.label}</div>
                      <div className="font-sans text-[19px] font-bold tracking-[-0.02em]">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Visual controls bar */}
              <div className="flex items-center gap-4 mb-4 flex-wrap bg-surface border border-border rounded-[8px] px-4 py-3">
                {/* Colour dots */}
                <div className="flex items-center gap-1.5">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-all',
                        color === c ? 'border-text scale-110' : 'border-transparent'
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>

                <div className="w-px h-4 bg-border" />

                {/* Opacity */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-muted">Opacity</span>
                  <input
                    type="range" min={20} max={100} step={5} value={opacity}
                    onChange={e => setOpacity(Number(e.target.value))}
                    className="w-20 h-[3px] bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[13px] [&::-webkit-slider-thumb]:h-[13px] [&::-webkit-slider-thumb]:bg-text [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_#111]"
                  />
                  <span className="font-mono text-[9px] text-muted w-7">{opacity}%</span>
                </div>

                <div className="w-px h-4 bg-border" />

                {/* Grid */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="font-mono text-[9px] text-muted">Grid</span>
                  <input
                    type="checkbox" checked={showGrid}
                    onChange={e => setShowGrid(e.target.checked)}
                    className="cursor-pointer accent-[#111111]"
                  />
                </label>

                {/* Smooth */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="font-mono text-[9px] text-muted">Smooth</span>
                  <input
                    type="checkbox" checked={smooth}
                    onChange={e => setSmooth(e.target.checked)}
                    className="cursor-pointer accent-[#111111]"
                  />
                </label>

                <div className="w-px h-4 bg-border" />

                {/* Title */}
                <input
                  type="text"
                  value={chartTitle}
                  onChange={e => setChartTitle(e.target.value)}
                  placeholder="Chart title (optional)"
                  className="ml-auto font-sans text-[12px] px-2.5 py-[5px] border border-border rounded-[6px] bg-bg text-text outline-none focus:border-blue w-48 transition-colors"
                />
              </div>

              {/* Chart card */}
              <div className="bg-surface border border-border rounded-[12px] px-6 py-5">
                {chartTitle && (
                  <div className="text-[18px] font-bold tracking-[-0.02em] mb-4">{chartTitle}</div>
                )}

                {UNSUPPORTED_CHART_TYPES.has(chartType) ? (
                  <div className="h-[360px] flex flex-col items-center justify-center gap-2">
                    <div className="font-mono text-[11px] text-muted">
                      {CHART_TYPES.find(t => t.value === chartType)?.label} requires a plugin
                    </div>
                    <div className="font-mono text-[10px] text-faint">Coming soon</div>
                  </div>
                ) : chartConfig ? (
                  <div style={{ position: 'relative', height: '360px' }}>
                    <Chart
                      key={chartKey}
                      ref={chartRef}
                      type={mapToChartJSType(chartType)}
                      data={chartConfig.data}
                      options={chartConfig.options}
                    />
                  </div>
                ) : (
                  <div className="h-[360px] flex items-center justify-center">
                    <span className="font-mono text-[11px] text-muted">Assign columns to see the chart</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                  <span className="font-mono text-[9px] text-faint">
                    Made with <strong className="text-muted">Plot</strong>
                  </span>
                  <span className="font-mono text-[9px] text-faint">
                    {parsedTable.rows.length} data points
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Fixed Export button ───────────────────────────────────────────── */}
      {showStep3 && (
        <button
          onClick={() => setShowExportModal(true)}
          className="fixed bottom-6 right-8 font-sans text-[13px] font-semibold text-white bg-text px-5 py-3 rounded-[8px] hover:bg-[#333] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        >
          ↓ Export
        </button>
      )}

      {/* ── Export modal ─────────────────────────────────────────────────── */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[500]"
          onClick={e => { if (e.target === e.currentTarget) setShowExportModal(false) }}
        >
          <div className="bg-surface border border-border rounded-[12px] w-[460px] overflow-hidden">
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
              {/* Resolution */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-2">Resolution</div>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setExportRes(r)}
                      className={cn(
                        'px-[14px] py-[6px] border rounded-[6px] font-mono text-[11px] transition-all',
                        exportRes === r ? 'bg-text text-white border-text' : 'border-border text-muted bg-bg'
                      )}
                    >
                      {r}× <span className="text-faint">{r === 1 ? '1200×800' : r === 2 ? '2400×1600' : '3600×2400'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-2">Background</div>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { key: 'white',       label: 'White',       color: '#fff' },
                    { key: 'offwhite',    label: 'Off-white',   color: '#F7F3EC' },
                    { key: 'dark',        label: 'Dark',        color: '#111' },
                    { key: 'transparent', label: 'Transparent', color: null },
                  ] as const).map(bg => (
                    <button
                      key={bg.key}
                      type="button"
                      onClick={() => setExportBg(bg.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-[6px] border rounded-[6px] font-mono text-[11px] text-muted transition-all',
                        exportBg === bg.key ? 'border-text text-text' : 'border-border'
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

              <button
                type="button"
                onClick={handleExportPNG}
                className="w-full py-2.5 bg-text text-white font-medium text-[13px] rounded-[8px] hover:bg-[#333] transition-all"
              >
                Download PNG
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
