// ── Chart Engine — matches plot_prototype_final_1.html exactly ────────────────

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChartType =
  | 'bar-vertical' | 'bar-horizontal' | 'bar-grouped' | 'bar-stacked' | 'lollipop'
  | 'line' | 'line-multi' | 'area' | 'area-stacked' | 'step'
  | 'pie' | 'doughnut' | 'treemap' | 'waffle'
  | 'histogram' | 'box-plot' | 'dot-plot'
  | 'scatter' | 'bubble' | 'heatmap'
  | 'candlestick' | 'waterfall' | 'funnel' | 'sankey'
  | 'radar' | 'bar-line' | 'gauge' | 'line-area' | 'error-bar'

export interface ParsedTable {
  headers: string[]
  rows: string[][]
  colCount: number
  rowCount: number
}

export type ColType = 'date' | 'integer' | 'decimal' | 'text'

export interface VisualConfig {
  color: string
  opacity: number       // 0–100
  radius: number        // px corner radius
  bg: 'white' | 'offwhite' | 'dark' | 'transparent'
  showGrid: boolean
  smooth: boolean
  logScale: boolean
  showLabels: boolean
  showAvgLine: boolean
  showLegend: boolean
  xLabel: string
  yLabel: string
  tickFormat: 'auto' | 'kmb' | 'inr' | 'usd' | 'pct'
}

export interface RoleDef { key: string; label: string }

// ── Chart type catalogue — 30 types ───────────────────────────────────────────

export const CHART_TYPES: { id: ChartType; label: string; group: string; icon: string }[] = [
  // Comparison
  { id: 'bar-vertical',   label: 'Bar',      group: 'Comparison', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="1" y="5" width="3" height="7" fill="currentColor" rx="1"/><rect x="6" y="2" width="3" height="10" fill="currentColor" rx="1"/><rect x="11" y="7" width="3" height="5" fill="currentColor" rx="1"/></svg>' },
  { id: 'bar-horizontal', label: 'H-Bar',    group: 'Comparison', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="1" width="10" height="3" fill="currentColor" rx="1"/><rect x="0" y="5" width="14" height="3" fill="currentColor" rx="1"/><rect x="0" y="9" width="7" height="3" fill="currentColor" rx="1"/></svg>' },
  { id: 'bar-grouped',    label: 'Grouped',  group: 'Comparison', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="1" y="4" width="2" height="8" fill="currentColor" rx="1"/><rect x="4" y="1" width="2" height="11" fill="currentColor" rx="1" opacity=".6"/><rect x="8" y="5" width="2" height="7" fill="currentColor" rx="1"/><rect x="11" y="2" width="2" height="10" fill="currentColor" rx="1" opacity=".6"/></svg>' },
  { id: 'bar-stacked',    label: 'Stacked',  group: 'Comparison', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="2" y="4" width="4" height="8" fill="currentColor" rx="1"/><rect x="2" y="1" width="4" height="3" fill="currentColor" rx="1" opacity=".5"/><rect x="9" y="5" width="4" height="7" fill="currentColor" rx="1"/><rect x="9" y="2" width="4" height="3" fill="currentColor" rx="1" opacity=".5"/></svg>' },
  { id: 'lollipop',       label: 'Lollipop', group: 'Comparison', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><line x1="3" y1="12" x2="3" y2="3" stroke="currentColor" stroke-width="1.5"/><circle cx="3" cy="3" r="2" fill="currentColor"/><line x1="9" y1="12" x2="9" y2="6" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="6" r="2" fill="currentColor"/><line x1="14" y1="12" x2="14" y2="1" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="1" r="2" fill="currentColor"/></svg>' },
  // Trend
  { id: 'line',           label: 'Line',     group: 'Trend', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><polyline points="0,10 4,5 8,7 12,2 16,5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' },
  { id: 'line-multi',     label: 'Multi',    group: 'Trend', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><polyline points="0,10 4,5 8,7 12,2 16,5" stroke="currentColor" stroke-width="1.5" fill="none"/><polyline points="0,8 4,9 8,4 12,6 16,3" stroke="currentColor" stroke-width="1.5" fill="none" opacity=".5"/></svg>' },
  { id: 'area',           label: 'Area',     group: 'Trend', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><polyline points="0,10 4,5 8,7 12,2 16,5" stroke="currentColor" stroke-width="1.5" fill="none"/><polygon points="0,10 4,5 8,7 12,2 16,5 16,12 0,12" fill="currentColor" opacity=".25"/></svg>' },
  { id: 'area-stacked',   label: 'S.Area',   group: 'Trend', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><polygon points="0,12 0,7 4,5 8,6 12,3 16,5 16,12" fill="currentColor" opacity=".6"/><polygon points="0,12 0,9 4,8 8,9 12,6 16,8 16,12" fill="currentColor" opacity=".3"/></svg>' },
  { id: 'step',           label: 'Step',     group: 'Trend', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><polyline points="0,10 5,10 5,5 10,5 10,2 16,2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  // Part-whole
  { id: 'pie',            label: 'Pie',      group: 'Part-whole', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><circle cx="8" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="10 22" stroke-dashoffset="0"/></svg>' },
  { id: 'doughnut',       label: 'Donut',    group: 'Part-whole', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><circle cx="8" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="9 16" stroke-dashoffset="0"/></svg>' },
  { id: 'treemap',        label: 'Treemap',  group: 'Part-whole', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="0" width="9" height="7" fill="currentColor" rx="1" opacity=".8"/><rect x="10" y="0" width="6" height="7" fill="currentColor" rx="1" opacity=".5"/><rect x="0" y="8" width="5" height="4" fill="currentColor" rx="1" opacity=".5"/><rect x="6" y="8" width="10" height="4" fill="currentColor" rx="1" opacity=".3"/></svg>' },
  { id: 'waffle',         label: 'Waffle',   group: 'Part-whole', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="0" width="3" height="3" fill="currentColor" rx=".5"/><rect x="4" y="0" width="3" height="3" fill="currentColor" rx=".5"/><rect x="8" y="0" width="3" height="3" fill="currentColor" rx=".5"/><rect x="12" y="0" width="3" height="3" fill="currentColor" rx=".5" opacity=".3"/><rect x="0" y="4" width="3" height="3" fill="currentColor" rx=".5"/><rect x="4" y="4" width="3" height="3" fill="currentColor" rx=".5"/><rect x="8" y="4" width="3" height="3" fill="currentColor" rx=".5" opacity=".3"/><rect x="12" y="4" width="3" height="3" fill="currentColor" rx=".5" opacity=".3"/></svg>' },
  // Distribution
  { id: 'histogram',      label: 'Histogram', group: 'Distribution', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="7" width="3" height="5" fill="currentColor" rx=".5"/><rect x="4" y="3" width="3" height="9" fill="currentColor" rx=".5"/><rect x="8" y="1" width="3" height="11" fill="currentColor" rx=".5"/><rect x="12" y="5" width="3" height="7" fill="currentColor" rx=".5"/></svg>' },
  { id: 'box-plot',       label: 'Box',       group: 'Distribution', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="4" y="3" width="8" height="7" fill="none" stroke="currentColor" stroke-width="1.5" rx=".5"/><line x1="8" y1="3" x2="8" y2="0" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="10" x2="8" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="1.5"/></svg>' },
  { id: 'dot-plot',       label: 'Dot',       group: 'Distribution', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><circle cx="3" cy="9" r="2" fill="currentColor"/><circle cx="7" cy="4" r="2" fill="currentColor"/><circle cx="11" cy="7" r="2" fill="currentColor"/><circle cx="5" cy="6" r="2" fill="currentColor" opacity=".5"/><circle cx="13" cy="3" r="2" fill="currentColor" opacity=".7"/></svg>' },
  // Correlation
  { id: 'scatter',        label: 'Scatter', group: 'Correlation', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><circle cx="4" cy="9" r="2" fill="currentColor"/><circle cx="8" cy="4" r="2" fill="currentColor"/><circle cx="12" cy="7" r="2" fill="currentColor"/><circle cx="6" cy="6" r="2" fill="currentColor" opacity=".6"/><circle cx="14" cy="2" r="2" fill="currentColor" opacity=".7"/></svg>' },
  { id: 'bubble',         label: 'Bubble',  group: 'Correlation', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><circle cx="4" cy="8" r="3" fill="currentColor" opacity=".7"/><circle cx="11" cy="5" r="4" fill="currentColor" opacity=".5"/><circle cx="7" cy="3" r="2" fill="currentColor" opacity=".9"/></svg>' },
  { id: 'heatmap',        label: 'Heatmap', group: 'Correlation', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="0" width="4" height="4" fill="currentColor" opacity=".9" rx=".5"/><rect x="5" y="0" width="4" height="4" fill="currentColor" opacity=".4" rx=".5"/><rect x="10" y="0" width="4" height="4" fill="currentColor" opacity=".2" rx=".5"/><rect x="0" y="5" width="4" height="4" fill="currentColor" opacity=".5" rx=".5"/><rect x="5" y="5" width="4" height="4" fill="currentColor" opacity=".9" rx=".5"/><rect x="10" y="5" width="4" height="4" fill="currentColor" opacity=".6" rx=".5"/></svg>' },
  // Financial
  { id: 'candlestick',    label: 'Candle',    group: 'Financial', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="2" y="3" width="3" height="7" fill="currentColor" rx=".5"/><line x1="3.5" y1="1" x2="3.5" y2="3" stroke="currentColor" stroke-width="1.5"/><line x1="3.5" y1="10" x2="3.5" y2="12" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="5" width="3" height="5" fill="currentColor" rx=".5" opacity=".4"/><line x1="10.5" y1="2" x2="10.5" y2="5" stroke="currentColor" stroke-width="1.5"/><line x1="10.5" y1="10" x2="10.5" y2="12" stroke="currentColor" stroke-width="1.5"/></svg>' },
  { id: 'waterfall',      label: 'Waterfall', group: 'Financial', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="1" y="6" width="3" height="6" fill="currentColor" rx=".5"/><rect x="5" y="3" width="3" height="3" fill="currentColor" rx=".5"/><rect x="9" y="4" width="3" height="2" fill="currentColor" rx=".5" opacity=".5"/><rect x="13" y="1" width="3" height="3" fill="currentColor" rx=".5"/></svg>' },
  // Flow
  { id: 'funnel',         label: 'Funnel', group: 'Flow', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="1" y="0" width="14" height="3" fill="currentColor" rx="1"/><rect x="3" y="4" width="10" height="3" fill="currentColor" rx="1" opacity=".7"/><rect x="5" y="8" width="6" height="3" fill="currentColor" rx="1" opacity=".5"/></svg>' },
  { id: 'sankey',         label: 'Sankey', group: 'Flow', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="1" width="2" height="10" fill="currentColor" rx="1"/><rect x="14" y="1" width="2" height="4" fill="currentColor" rx="1"/><rect x="14" y="7" width="2" height="4" fill="currentColor" rx=".5" opacity=".6"/><path d="M2,6 Q8,4 14,3" fill="none" stroke="currentColor" stroke-width="3" opacity=".4"/><path d="M2,7 Q8,9 14,9" fill="none" stroke="currentColor" stroke-width="2" opacity=".3"/></svg>' },
  // Other
  { id: 'radar',          label: 'Radar',   group: 'Other', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><polygon points="8,1 14,5 12,11 4,11 2,5" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="1"/><polygon points="8,4 11,6 10,9 6,9 5,6" fill="currentColor" opacity=".6"/></svg>' },
  { id: 'bar-line',       label: 'Bar+Line', group: 'Other', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="1" y="5" width="3" height="7" fill="currentColor" rx="1"/><rect x="6" y="2" width="3" height="10" fill="currentColor" rx="1"/><rect x="11" y="6" width="3" height="6" fill="currentColor" rx="1"/><polyline points="0,4 5,4 10,2 16,5" stroke="currentColor" stroke-width="2" fill="none" opacity=".7"/></svg>' },
  { id: 'gauge',          label: 'Gauge',   group: 'Other', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><path d="M2,10 A6,6 0 0,1 14,10" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".25"/><path d="M2,10 A6,6 0 0,1 10,4" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="8" y1="10" x2="11" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  { id: 'line-area',      label: 'L+Area',  group: 'Other', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><polyline points="0,9 4,5 8,7 12,2 16,4" stroke="currentColor" stroke-width="1.5" fill="none"/><polygon points="0,9 4,5 8,7 12,2 16,4 16,12 0,12" fill="currentColor" opacity=".2"/></svg>' },
  { id: 'error-bar',      label: 'Error',   group: 'Other', icon: '<svg width="16" height="12" viewBox="0 0 16 12"><rect x="2" y="4" width="3" height="8" fill="currentColor" rx="1"/><line x1="3.5" y1="2" x2="3.5" y2="4" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="2" x2="5" y2="2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="5" width="3" height="7" fill="currentColor" rx="1"/><line x1="11.5" y1="1" x2="11.5" y2="5" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="1" x2="13" y2="1" stroke="currentColor" stroke-width="1.5"/></svg>' },
]

// ── Roles (column mappings per chart type) ─────────────────────────────────────

export const ROLES: Record<ChartType, RoleDef[]> = {
  'bar-vertical':   [{ key: 'x', label: 'X Axis (labels)' }, { key: 'y', label: 'Y Axis (values)' }],
  'bar-horizontal': [{ key: 'x', label: 'Y Axis (labels)' }, { key: 'y', label: 'X Axis (values)' }],
  'bar-grouped':    [{ key: 'x', label: 'X Axis (labels)' }, { key: 'y1', label: 'Series 1' }, { key: 'y2', label: 'Series 2' }, { key: 'y3', label: 'Series 3 (opt)' }],
  'bar-stacked':    [{ key: 'x', label: 'X Axis (labels)' }, { key: 'y1', label: 'Series 1' }, { key: 'y2', label: 'Series 2' }, { key: 'y3', label: 'Series 3 (opt)' }],
  'lollipop':       [{ key: 'x', label: 'Labels' }, { key: 'y', label: 'Values' }],
  'line':           [{ key: 'x', label: 'X Axis (date/cat)' }, { key: 'y', label: 'Y Axis (values)' }],
  'line-multi':     [{ key: 'x', label: 'X Axis' }, { key: 'y1', label: 'Line 1' }, { key: 'y2', label: 'Line 2' }, { key: 'y3', label: 'Line 3 (opt)' }],
  'area':           [{ key: 'x', label: 'X Axis' }, { key: 'y', label: 'Values' }],
  'area-stacked':   [{ key: 'x', label: 'X Axis' }, { key: 'y1', label: 'Series 1' }, { key: 'y2', label: 'Series 2' }],
  'step':           [{ key: 'x', label: 'X Axis' }, { key: 'y', label: 'Values' }],
  'pie':            [{ key: 'x', label: 'Labels' }, { key: 'y', label: 'Values' }],
  'doughnut':       [{ key: 'x', label: 'Labels' }, { key: 'y', label: 'Values' }],
  'treemap':        [{ key: 'x', label: 'Category' }, { key: 'y', label: 'Values' }],
  'waffle':         [{ key: 'x', label: 'Labels' }, { key: 'y', label: 'Values (%)' }],
  'histogram':      [{ key: 'y', label: 'Values to distribute' }],
  'box-plot':       [{ key: 'x', label: 'Category' }, { key: 'y', label: 'Values' }],
  'dot-plot':       [{ key: 'x', label: 'Category' }, { key: 'y', label: 'Values' }],
  'scatter':        [{ key: 'x', label: 'X Values' }, { key: 'y', label: 'Y Values' }],
  'bubble':         [{ key: 'x', label: 'X Values' }, { key: 'y', label: 'Y Values' }, { key: 'r', label: 'Size values' }],
  'heatmap':        [{ key: 'x', label: 'X Axis' }, { key: 'y', label: 'Y Axis' }, { key: 'v', label: 'Values' }],
  'candlestick':    [{ key: 'x', label: 'Date' }, { key: 'o', label: 'Open' }, { key: 'h', label: 'High' }, { key: 'l', label: 'Low' }, { key: 'c', label: 'Close' }],
  'waterfall':      [{ key: 'x', label: 'Labels' }, { key: 'y', label: 'Values (+/−)' }],
  'funnel':         [{ key: 'x', label: 'Stages' }, { key: 'y', label: 'Values' }],
  'sankey':         [{ key: 'x', label: 'From (source)' }, { key: 'y', label: 'To (target)' }, { key: 'v', label: 'Flow value' }],
  'radar':          [{ key: 'x', label: 'Dimensions' }, { key: 'y', label: 'Values' }],
  'bar-line':       [{ key: 'x', label: 'X Axis' }, { key: 'y1', label: 'Bar values' }, { key: 'y2', label: 'Line values' }],
  'gauge':          [{ key: 'y', label: 'Current value' }, { key: 'max', label: 'Max value (opt)' }],
  'line-area':      [{ key: 'x', label: 'X Axis' }, { key: 'y', label: 'Values' }],
  'error-bar':      [{ key: 'x', label: 'Labels' }, { key: 'y', label: 'Values' }, { key: 'e', label: 'Error (±)' }],
}

// ── CSV parsing ────────────────────────────────────────────────────────────────

export function parseCSV(raw: string): ParsedTable | null {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length < 2) return null
  const delim = lines[0].includes('\t') ? '\t' : ','

  function parseRow(line: string): string[] {
    const cells: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; continue } // escaped ""
        inQ = !inQ; continue
      }
      if (c === delim && !inQ) { cells.push(cur.trim()); cur = '' } else cur += c
    }
    cells.push(cur.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow)
  if (rows.length === 0) return null
  return { headers, rows, colCount: headers.length, rowCount: rows.length }
}

// ── Column type detection ──────────────────────────────────────────────────────

export function detectColTypes(table: ParsedTable): ColType[] {
  return table.headers.map((_, ci) => {
    const sample = table.rows.map(r => r[ci] || '').filter(v => v).slice(0, 10)
    if (!sample.length) return 'text'
    const isDate = /^(\d{4}[-/]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|\d{1,2}[-/])/i
    if (sample.every(v => isDate.test(v.trim()))) return 'date'
    const num = (v: string) => parseFloat(v.replace(/[$,₹%]/g, ''))
    if (sample.every(v => !isNaN(num(v)))) {
      return sample.every(v => Number.isInteger(num(v))) ? 'integer' : 'decimal'
    }
    return 'text'
  })
}

// ── Chart type suggestion ──────────────────────────────────────────────────────

export function suggestChartType(table: ParsedTable, types: ColType[]): ChartType {
  const hasDt = types.includes('date')
  const numCols = types.filter(t => t === 'integer' || t === 'decimal').length
  const isOHLC = table.colCount >= 5 &&
    ['integer', 'decimal'].includes(types[1]) &&
    ['integer', 'decimal'].includes(types[2])
  if (isOHLC) return 'candlestick'
  if (hasDt && numCols === 1) return 'line'
  if (hasDt && numCols > 1) return 'line-multi'
  if (!hasDt && numCols === 1 && table.rowCount <= 8) return 'bar-vertical'
  if (!hasDt && numCols === 1 && table.rowCount > 8) return 'bar-horizontal'
  if (!hasDt && numCols >= 2) return 'bar-grouped'
  return 'bar-vertical'
}

// ── Mapping auto-assignment ────────────────────────────────────────────────────

export function autoAssignMappings(table: ParsedTable, chartType: ChartType): Record<string, number> {
  const roles = ROLES[chartType] || []
  const m: Record<string, number> = {}
  roles.forEach((r, i) => {
    if (i < table.colCount) m[r.key] = i
  })
  return m
}

// ── Color helpers ──────────────────────────────────────────────────────────────

export function hexToRgba(hex: string, a: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function colorScale(base: string, n: number): string[] {
  const alphas = [1, 0.75, 0.55, 0.4, 0.3, 0.2, 0.15]
  return Array.from({ length: n }, (_, i) => hexToRgba(base, alphas[i % alphas.length]))
}

// ── Tick formatter ─────────────────────────────────────────────────────────────

export function tickFmt(v: number, fmt: string): string {
  const n = Number(v)
  if (fmt === 'kmb') {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
    return String(n)
  }
  if (fmt === 'inr') {
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(1) + 'Cr'
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + 'L'
    if (n >= 1e3) return '₹' + (n / 1e3).toFixed(0) + 'K'
    return '₹' + n
  }
  if (fmt === 'usd') {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
    return '$' + n
  }
  if (fmt === 'pct') return n + '%'
  // auto
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'k'
  return String(n)
}

// ── Base chart options ─────────────────────────────────────────────────────────

const FONT = 'Helvetica, Arial, sans-serif'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildBaseOptions(vis: VisualConfig): any {
  const fmt = vis.tickFormat || 'auto'
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 280, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        display: vis.showLegend,
        position: 'bottom',
        labels: { font: { family: FONT, size: 10 }, color: '#888', padding: 12, boxWidth: 10, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#111',
        titleColor: '#fff',
        bodyColor: '#ccc',
        titleFont: { family: FONT, size: 12, weight: 'bold' },
        bodyFont: { family: FONT, size: 11 },
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
      },
      datalabels: {
        display: vis.showLabels,
        color: '#555',
        font: { family: FONT, size: 10, weight: 'bold' as const },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (value: any) => {
          const n = Number(value)
          return isNaN(n) ? value : tickFmt(n, fmt)
        },
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 2,
        clip: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: FONT, size: 10 }, color: '#AAA', maxRotation: 45, autoSkip: true, maxTicksLimit: 14 },
        title: { display: !!vis.xLabel, text: vis.xLabel, font: { family: FONT, size: 10 }, color: '#AAA' },
      },
      y: {
        type: vis.logScale ? 'logarithmic' : 'linear',
        grid: { display: vis.showGrid, color: '#F0F0F0', lineWidth: 1 },
        border: { display: false },
        beginAtZero: true,
        ticks: {
          font: { family: FONT, size: 10 },
          color: '#AAA',
          padding: 8,
          callback: (v: number) => tickFmt(v, fmt),
        },
        title: { display: !!vis.yLabel, text: vis.yLabel, font: { family: FONT, size: 10 }, color: '#AAA' },
      },
    },
  }
}

// ── Column extractor helpers ───────────────────────────────────────────────────

function getCol(table: ParsedTable, mappings: Record<string, number>, key: string): string[] {
  const ci = mappings[key]
  if (ci === undefined || ci === -1) return []
  return table.rows.map(r => (r[ci] || '').trim())
}

function parseNums(arr: string[]): number[] {
  return arr.map(v => {
    const n = parseFloat(v.replace(/[$,₹%\s]/g, ''))
    return isNaN(n) ? 0 : n
  })
}

// ── Chart config builder — all 30 types ───────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function avgLineDataset(vals: number[], n: number, fmt: string, color = '#F0A500'): object {
  if (!vals.length) return {}
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return {
    type: 'line',
    label: `Avg: ${tickFmt(avg, fmt)}`,
    data: Array(n).fill(avg),
    borderColor: color,
    borderWidth: 1.5,
    borderDash: [5, 4],
    pointRadius: 0,
    fill: false,
    tension: 0,
    datalabels: { display: false },
  }
}

// Shared tooltip config reused by custom-options charts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharedTooltip = {
  backgroundColor: '#111',
  titleColor: '#fff',
  bodyColor: '#ccc',
  titleFont: { family: FONT, size: 12, weight: 'bold' as const },
  bodyFont: { family: FONT, size: 11 },
  padding: 10,
  cornerRadius: 6,
  displayColors: false,
}

// Pie/doughnut percent formatter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pctFormatter = (v: number, ctx: { dataset: { data: number[] } }) => {
  const sum = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
  return sum ? Math.round(v / sum * 100) + '%' : ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildChartConfig(
  table: ParsedTable,
  mappings: Record<string, number>,
  chartType: ChartType,
  vis: VisualConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { type: string; data: any; options: any } {
  const color = vis.color
  const op = vis.opacity / 100
  const radius = vis.radius
  const fmt = vis.tickFormat || 'auto'

  const labels = getCol(table, mappings, 'x')
  const vals = parseNums(getCol(table, mappings, 'y'))
  const ct = chartType

  // ── BAR VERTICAL ──
  if (ct === 'bar-vertical') {
    const datasets: object[] = [{ data: vals, backgroundColor: hexToRgba(color, op), borderRadius: radius, borderSkipped: false, hoverBackgroundColor: hexToRgba(color, Math.min(op + 0.15, 1)) }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'bar', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── BAR HORIZONTAL ──
  if (ct === 'bar-horizontal') {
    const opts = buildBaseOptions(vis)
    opts.indexAxis = 'y'
    const datasets: object[] = [{ data: vals, backgroundColor: hexToRgba(color, op), borderRadius: radius, borderSkipped: false }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'bar', data: { labels, datasets }, options: opts }
  }

  // ── BAR GROUPED / STACKED ──
  if (ct === 'bar-grouped' || ct === 'bar-stacked') {
    const labs = getCol(table, mappings, 'x')
    const s1 = parseNums(getCol(table, mappings, 'y1'))
    const s2 = parseNums(getCol(table, mappings, 'y2'))
    const s3 = parseNums(getCol(table, mappings, 'y3'))
    const cols = colorScale(color, 3)
    const dsets: object[] = [
      { label: table.headers[mappings.y1] || 'Series 1', data: s1, backgroundColor: cols[0], borderRadius: radius, borderSkipped: false },
      ...(s2.length ? [{ label: table.headers[mappings.y2] || 'Series 2', data: s2, backgroundColor: cols[1], borderRadius: radius, borderSkipped: false }] : []),
      ...(s3.length ? [{ label: table.headers[mappings.y3] || 'Series 3', data: s3, backgroundColor: cols[2], borderRadius: radius, borderSkipped: false }] : []),
    ]
    if (vis.showAvgLine) dsets.push(avgLineDataset(s1, labs.length, fmt))
    const opts = buildBaseOptions(vis)
    if (ct === 'bar-stacked') { opts.scales.x.stacked = true; opts.scales.y.stacked = true }
    opts.plugins.legend.display = true  // multi-series always needs legend; toggle controls single-series
    return { type: 'bar', data: { labels: labs, datasets: dsets }, options: opts }
  }

  // ── LOLLIPOP ──
  if (ct === 'lollipop') {
    const datasets: object[] = [{ data: vals, backgroundColor: hexToRgba(color, op), borderRadius: 10, borderSkipped: false, barThickness: 3 }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'bar', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── LINE ──
  if (ct === 'line') {
    const datasets: object[] = [{ data: vals, borderColor: color, borderWidth: 2.5, backgroundColor: hexToRgba(color, 0.1), fill: false, tension: vis.smooth ? 0.4 : 0, pointBackgroundColor: color, pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6 }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'line', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── MULTI-LINE ──
  if (ct === 'line-multi') {
    const labs = getCol(table, mappings, 'x')
    const cols = colorScale(color, 3)
    const keys = ['y1', 'y2', 'y3']
    const dsets: object[] = keys.map((k, i) => {
      const d = parseNums(getCol(table, mappings, k))
      if (!d.length) return null
      return { label: table.headers[mappings[k]] || `Line ${i + 1}`, data: d, borderColor: cols[i], borderWidth: 2, backgroundColor: hexToRgba(cols[i], 0.08), fill: false, tension: vis.smooth ? 0.4 : 0, pointRadius: 3, pointBackgroundColor: cols[i] }
    }).filter(Boolean) as object[]
    const s1 = parseNums(getCol(table, mappings, 'y1'))
    if (vis.showAvgLine && s1.length) dsets.push(avgLineDataset(s1, labs.length, fmt))
    const opts = buildBaseOptions(vis)
    opts.plugins.legend.display = true  // multi-line always needs legend
    return { type: 'line', data: { labels: labs, datasets: dsets }, options: opts }
  }

  // ── AREA ──
  if (ct === 'area') {
    const datasets: object[] = [{ data: vals, borderColor: color, borderWidth: 2, backgroundColor: hexToRgba(color, 0.18), fill: true, tension: vis.smooth ? 0.4 : 0, pointBackgroundColor: color, pointRadius: 3 }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'line', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── STACKED AREA ──
  if (ct === 'area-stacked') {
    const labs = getCol(table, mappings, 'x')
    const cols = colorScale(color, 2)
    const s1 = parseNums(getCol(table, mappings, 'y1'))
    const s2 = parseNums(getCol(table, mappings, 'y2'))
    const opts = buildBaseOptions(vis)
    opts.scales.y.stacked = true
    opts.plugins.legend.display = true  // stacked area always needs legend
    return {
      type: 'line',
      data: { labels: labs, datasets: [
        { label: table.headers[mappings.y1] || 'S1', data: s1, borderColor: cols[0], backgroundColor: hexToRgba(cols[0], 0.5), fill: true, tension: vis.smooth ? 0.4 : 0 },
        ...(s2.length ? [{ label: table.headers[mappings.y2] || 'S2', data: s2, borderColor: cols[1], backgroundColor: hexToRgba(cols[1], 0.4), fill: true, tension: vis.smooth ? 0.4 : 0 }] : []),
      ] },
      options: opts,
    }
  }

  // ── STEP ──
  if (ct === 'step') {
    const datasets: object[] = [{ data: vals, borderColor: color, borderWidth: 2, backgroundColor: hexToRgba(color, 0.1), stepped: 'before', fill: true, pointRadius: 3, pointBackgroundColor: color }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'line', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── PIE ──
  if (ct === 'pie') {
    const lgndPos = vis.showLegend ? 'right' : 'bottom'
    return {
      type: 'pie',
      data: { labels, datasets: [{ data: vals, backgroundColor: colorScale(color, vals.length), borderColor: '#fff', borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 280 },
        plugins: {
          legend: { display: vis.showLegend, position: lgndPos, labels: { font: { family: FONT, size: 10 }, color: '#888', boxWidth: 10 } },
          tooltip: sharedTooltip,
          datalabels: { display: vis.showLabels, color: '#fff', font: { family: FONT, size: 10, weight: 'bold' as const }, formatter: pctFormatter },
        },
      },
    }
  }

  // ── DOUGHNUT ──
  if (ct === 'doughnut') {
    const lgndPos = vis.showLegend ? 'right' : 'bottom'
    return {
      type: 'doughnut',
      data: { labels, datasets: [{ data: vals, backgroundColor: colorScale(color, vals.length), borderColor: '#fff', borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%', animation: { duration: 280 },
        plugins: {
          legend: { display: vis.showLegend, position: lgndPos, labels: { font: { family: FONT, size: 10 }, color: '#888', boxWidth: 10 } },
          tooltip: sharedTooltip,
          datalabels: { display: vis.showLabels, color: '#fff', font: { family: FONT, size: 10, weight: 'bold' as const }, formatter: pctFormatter },
        },
      },
    }
  }

  // ── TREEMAP / WAFFLE — rendered as proportional pie ──
  if (ct === 'treemap' || ct === 'waffle') {
    const cols = colorScale(color, vals.length)
    const lgndPos = vis.showLegend ? 'right' : 'bottom'
    return {
      type: 'pie',
      data: { labels, datasets: [{ data: vals, backgroundColor: cols, borderColor: '#fff', borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 280 },
        plugins: {
          legend: { display: vis.showLegend, position: lgndPos, labels: { font: { family: FONT, size: 10 }, color: '#888', boxWidth: 10 } },
          tooltip: sharedTooltip,
          datalabels: { display: vis.showLabels, color: '#fff', font: { family: FONT, size: 10, weight: 'bold' as const }, formatter: pctFormatter },
        },
      },
    }
  }

  // ── HISTOGRAM ──
  if (ct === 'histogram') {
    const raw = parseNums(getCol(table, mappings, 'y')).filter(v => !isNaN(v) && v !== 0)
    if (!raw.length) return { type: 'bar', data: { labels: [], datasets: [] }, options: buildBaseOptions(vis) }
    const mn = Math.min(...raw), mx = Math.max(...raw), bins = 10
    const bsz = (mx - mn) / bins
    const buckets = Array.from({ length: bins }, (_, i) => ({ min: mn + i * bsz, max: mn + (i + 1) * bsz, n: 0 }))
    raw.forEach(v => { const i = Math.min(Math.floor((v - mn) / bsz), bins - 1); buckets[i].n++ })
    const labs = buckets.map(b => `${b.min.toFixed(0)}–${b.max.toFixed(0)}`)
    const counts = buckets.map(b => b.n)
    const datasets: object[] = [{ data: counts, backgroundColor: hexToRgba(color, op), borderColor: color, borderWidth: 1, borderRadius: 0, borderSkipped: false, categoryPercentage: 1, barPercentage: 1 }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(counts, bins, fmt))
    return { type: 'bar', data: { labels: labs, datasets }, options: buildBaseOptions(vis) }
  }

  // ── DOT PLOT ──
  if (ct === 'dot-plot') {
    const xsRaw = getCol(table, mappings, 'x')
    const ys = parseNums(getCol(table, mappings, 'y'))
    // If x is numeric, use as scatter; otherwise use category index
    const xNums = parseNums(xsRaw)
    const pts = xNums.map((x, i) => ({ x, y: ys[i] ?? 0 }))
    const opts = buildBaseOptions(vis)
    opts.scales.x = { type: 'linear', grid: { display: false }, ticks: { font: { family: FONT, size: 10 }, color: '#AAA' }, title: { display: !!vis.xLabel, text: vis.xLabel, font: { family: FONT, size: 10 }, color: '#AAA' } }
    const datasets: object[] = [{ data: pts, backgroundColor: hexToRgba(color, op), pointRadius: 6, pointHoverRadius: 8, pointStyle: 'circle', datalabels: { display: false } }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(ys, ys.length, fmt))
    return { type: 'scatter', data: { datasets }, options: opts }
  }

  // ── SCATTER ──
  if (ct === 'scatter') {
    const xs = parseNums(getCol(table, mappings, 'x'))
    const ys = parseNums(getCol(table, mappings, 'y'))
    const pts = xs.map((x, i) => ({ x, y: ys[i] ?? 0 }))
    const opts = buildBaseOptions(vis)
    opts.scales.x = { type: 'linear', grid: { display: false }, ticks: { font: { family: FONT, size: 10 }, color: '#AAA' }, title: { display: !!vis.xLabel, text: vis.xLabel, font: { family: FONT, size: 10 }, color: '#AAA' } }
    // Override datalabels formatter for scatter points
    opts.plugins.datalabels.formatter = (value: { x: number; y: number }) => `(${tickFmt(value.x, fmt)}, ${tickFmt(value.y, fmt)})`
    const datasets: object[] = [{ data: pts, backgroundColor: hexToRgba(color, op), pointRadius: 5, pointHoverRadius: 7 }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(ys, ys.length, fmt))
    return { type: 'scatter', data: { datasets }, options: opts }
  }

  // ── BUBBLE ──
  if (ct === 'bubble') {
    const xs = parseNums(getCol(table, mappings, 'x'))
    const ys = parseNums(getCol(table, mappings, 'y'))
    const rs = parseNums(getCol(table, mappings, 'r'))
    const maxR = Math.max(...rs) || 1
    const pts = xs.map((x, i) => ({ x, y: ys[i] ?? 0, r: Math.max(((rs[i] || 0) / maxR) * 20, 3) }))
    const opts = buildBaseOptions(vis)
    opts.scales.x = { type: 'linear', grid: { display: false }, ticks: { font: { family: FONT, size: 10 }, color: '#AAA' }, title: { display: !!vis.xLabel, text: vis.xLabel, font: { family: FONT, size: 10 }, color: '#AAA' } }
    opts.plugins.datalabels.formatter = (value: { x: number; y: number }) => `${tickFmt(value.y, fmt)}`
    return { type: 'bubble', data: { datasets: [{ data: pts, backgroundColor: hexToRgba(color, op * 0.8), borderColor: color, borderWidth: 1 }] }, options: opts }
  }

  // ── HEATMAP — color intensity encoding ──
  if (ct === 'heatmap') {
    const maxV = Math.max(...vals) || 1
    const bgColors = vals.map(v => hexToRgba(color, 0.15 + 0.8 * (v / maxV)))
    const datasets: object[] = [{ data: vals, backgroundColor: bgColors, borderRadius: 2, borderSkipped: false }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'bar', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── WATERFALL ──
  if (ct === 'waterfall') {
    let running = 0
    const bases: number[] = [], sizes: number[] = [], bgs: string[] = []
    vals.forEach(v => {
      const base = v >= 0 ? running : running + v
      bases.push(base)
      sizes.push(Math.abs(v))
      bgs.push(v >= 0 ? hexToRgba(color, op) : hexToRgba('#E24B4A', op))
      running += v
    })
    const opts = buildBaseOptions(vis)
    opts.scales.y.stacked = true
    return {
      type: 'bar',
      data: { labels, datasets: [
        { data: bases, backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, borderSkipped: false, datalabels: { display: false } },
        { data: sizes, backgroundColor: bgs, borderRadius: radius, borderSkipped: false },
      ] },
      options: opts,
    }
  }

  // ── FUNNEL ──
  if (ct === 'funnel') {
    const sorted = [...labels.map((l, i) => ({ l, v: vals[i] || 0 }))].sort((a, b) => b.v - a.v)
    const cols = sorted.map((_, i) => hexToRgba(color, Math.max(0.9 - i * 0.08, 0.2)))
    const opts = buildBaseOptions(vis)
    opts.indexAxis = 'y'
    return {
      type: 'bar',
      data: { labels: sorted.map(s => s.l), datasets: [{ data: sorted.map(s => s.v), backgroundColor: cols, borderRadius: 4, borderSkipped: false }] },
      options: opts,
    }
  }

  // ── RADAR ──
  if (ct === 'radar') {
    return {
      type: 'radar',
      data: { labels, datasets: [{ data: vals, borderColor: color, backgroundColor: hexToRgba(color, 0.15), pointBackgroundColor: color, borderWidth: 2, pointRadius: 3 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 280 },
        scales: { r: { grid: { color: '#F0F0F0' }, ticks: { font: { family: FONT, size: 9 }, color: '#AAA' }, pointLabels: { font: { family: FONT, size: 10 }, color: '#555' } } },
        plugins: {
          legend: { display: vis.showLegend, position: 'bottom', labels: { font: { family: FONT, size: 10 }, color: '#888', boxWidth: 10 } },
          tooltip: sharedTooltip,
          datalabels: { display: vis.showLabels, color: '#555', font: { family: FONT, size: 10, weight: 'bold' as const }, formatter: (v: number) => tickFmt(v, fmt) },
        },
      },
    }
  }

  // ── BAR + LINE COMBO ──
  if (ct === 'bar-line') {
    const labs = getCol(table, mappings, 'x')
    const bv = parseNums(getCol(table, mappings, 'y1'))
    const lv = parseNums(getCol(table, mappings, 'y2'))
    const opts = buildBaseOptions(vis)
    opts.plugins.legend.display = true  // bar+line always needs legend
    const datasets: object[] = [
      { type: 'bar', label: table.headers[mappings.y1] || 'Bars', data: bv, backgroundColor: hexToRgba(color, op), borderRadius: radius, borderSkipped: false, yAxisID: 'y' },
      ...(lv.length ? [{ type: 'line', label: table.headers[mappings.y2] || 'Line', data: lv, borderColor: '#F0A500', backgroundColor: 'rgba(240,165,0,.08)', borderWidth: 2.5, fill: false, tension: vis.smooth ? 0.4 : 0, pointRadius: 4, pointBackgroundColor: '#F0A500', yAxisID: 'y' }] : []),
    ]
    if (vis.showAvgLine) datasets.push(avgLineDataset(bv, labs.length, fmt))
    return { type: 'bar', data: { labels: labs, datasets }, options: opts }
  }

  // ── GAUGE ──
  if (ct === 'gauge') {
    const v = parseNums(getCol(table, mappings, 'y'))[0] || 0
    const maxV = parseNums(getCol(table, mappings, 'max'))[0] || 100
    const pct = Math.min(v / maxV, 1)
    return {
      type: 'doughnut',
      data: { labels: ['Value', 'Remaining'], datasets: [{ data: [pct * 100, (1 - pct) * 100], backgroundColor: [hexToRgba(color, op), '#F0F0F0'], borderColor: ['transparent', 'transparent'], borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%', rotation: -90, circumference: 180,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: { display: false },
        },
      },
    }
  }

  // ── LINE + AREA ──
  if (ct === 'line-area') {
    const datasets: object[] = [{ data: vals, borderColor: color, borderWidth: 2, backgroundColor: hexToRgba(color, 0.2), fill: true, tension: vis.smooth ? 0.4 : 0, pointBackgroundColor: color, pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 }]
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'line', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── ERROR BAR — bars with whiskers showing ± error ──
  if (ct === 'error-bar') {
    const errors = parseNums(getCol(table, mappings, 'e'))
    const hasErrors = errors.some(e => e > 0)
    const datasets: object[] = [
      { data: vals, backgroundColor: hexToRgba(color, op), borderRadius: radius, borderSkipped: false },
    ]
    if (hasErrors) {
      // Whisker as thin floating bar [val-e, val+e]
      datasets.push({
        data: vals.map((v, i) => [v - (errors[i] ?? 0), v + (errors[i] ?? 0)]),
        backgroundColor: 'transparent',
        borderColor: hexToRgba(color, 0.75),
        borderWidth: 2,
        barThickness: 3,
        borderSkipped: false,
        datalabels: { display: false },
      })
    }
    if (vis.showAvgLine) datasets.push(avgLineDataset(vals, labels.length, fmt))
    return { type: 'bar', data: { labels, datasets }, options: buildBaseOptions(vis) }
  }

  // ── BOX PLOT — per-category IQR boxes with whiskers ──
  if (ct === 'box-plot') {
    const xLabels = getCol(table, mappings, 'x')
    const yVals = parseNums(getCol(table, mappings, 'y'))

    // Group by category (x), or treat all as one group if no x mapping
    const groupMap: Record<string, number[]> = {}
    if (xLabels.length && xLabels.some(l => l)) {
      xLabels.forEach((l, i) => {
        const key = l || 'All'
        if (!groupMap[key]) groupMap[key] = []
        groupMap[key].push(yVals[i] ?? 0)
      })
    } else {
      groupMap['Distribution'] = yVals
    }
    const cats = Object.keys(groupMap)
    const stats = cats.map(cat => {
      const sv = [...groupMap[cat]].sort((a, b) => a - b)
      const n = sv.length
      return {
        min: sv[0] ?? 0,
        q1: sv[Math.floor(n * 0.25)] ?? 0,
        med: sv[Math.floor(n * 0.5)] ?? 0,
        q3: sv[Math.floor(n * 0.75)] ?? 0,
        max: sv[n - 1] ?? 0,
      }
    })
    const opts = buildBaseOptions(vis)
    opts.scales.y.beginAtZero = false
    opts.plugins.datalabels = { display: false }
    return {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [
          // Lower whisker [min, q1] — thin
          { data: stats.map(s => [s.min, s.q1]), backgroundColor: 'transparent', borderColor: hexToRgba(color, 0.65), borderWidth: 2, barThickness: 3, borderSkipped: false, label: 'Whisker low' },
          // IQR box [q1, q3] — full width
          { data: stats.map(s => [s.q1, s.q3]), backgroundColor: hexToRgba(color, op * 0.6), borderColor: color, borderWidth: 1.5, barPercentage: 0.55, borderRadius: 2, borderSkipped: false, label: 'IQR' },
          // Median line [med, med+tiny] drawn as a full-width thin bar
          { data: stats.map(s => [s.med - 0.001, s.med + 0.001]), backgroundColor: color, borderColor: color, borderWidth: 0, barPercentage: 0.55, borderSkipped: false, label: 'Median', datalabels: { display: false } },
          // Upper whisker [q3, max] — thin
          { data: stats.map(s => [s.q3, s.max]), backgroundColor: 'transparent', borderColor: hexToRgba(color, 0.65), borderWidth: 2, barThickness: 3, borderSkipped: false, label: 'Whisker high' },
        ],
      },
      options: opts,
    }
  }

  // ── CANDLESTICK — OHLC floating bars (no external plugin needed) ──
  if (ct === 'candlestick') {
    const dates = getCol(table, mappings, 'x')
    const opens  = parseNums(getCol(table, mappings, 'o'))
    const highs  = parseNums(getCol(table, mappings, 'h'))
    const lows   = parseNums(getCol(table, mappings, 'l'))
    const closes = parseNums(getCol(table, mappings, 'c'))
    const n = Math.min(opens.length, highs.length, lows.length, closes.length)
    if (!n) return { type: 'bar', data: { labels, datasets: [{ data: vals, backgroundColor: hexToRgba(color, op), borderRadius: radius, borderSkipped: false }] }, options: buildBaseOptions(vis) }

    const isUp = closes.slice(0, n).map((c, i) => c >= opens[i])
    const upCol = '#10B981', downCol = '#E24B4A'
    const opts = buildBaseOptions(vis)
    opts.scales.y.beginAtZero = false
    opts.plugins.datalabels = { display: false }
    opts.plugins.legend.display = false
    return {
      type: 'bar',
      data: {
        labels: dates.slice(0, n),
        datasets: [
          // Wicks: thin bar from low to high
          {
            label: 'Wick',
            data: Array.from({ length: n }, (_, i) => [lows[i], highs[i]]),
            backgroundColor: isUp.map(up => hexToRgba(up ? upCol : downCol, 0.4)),
            borderColor: isUp.map(up => up ? upCol : downCol),
            borderWidth: 1,
            barThickness: 2,
            borderSkipped: false,
            datalabels: { display: false },
          },
          // Body: floating bar from open to close
          {
            label: 'Body',
            data: Array.from({ length: n }, (_, i) => [Math.min(opens[i], closes[i]), Math.max(opens[i], closes[i])]),
            backgroundColor: isUp.map(up => hexToRgba(up ? upCol : downCol, 0.8)),
            borderColor: isUp.map(up => up ? upCol : downCol),
            borderWidth: 1,
            barPercentage: 0.65,
            borderSkipped: false,
            borderRadius: 1,
            datalabels: { display: false },
          },
        ],
      },
      options: opts,
    }
  }

  // ── SANKEY — rendered as horizontal flow bars (source-to-target approximation) ──
  if (ct === 'sankey') {
    const fromLabels = getCol(table, mappings, 'x')
    const toLabels = getCol(table, mappings, 'y')
    const flowVals = parseNums(getCol(table, mappings, 'v'))
    // Aggregate by source: sum of outflows per source node
    const agg: Record<string, number> = {}
    fromLabels.forEach((src, i) => {
      agg[src] = (agg[src] || 0) + (flowVals[i] || 0)
    })
    const aggLabels = Object.keys(agg)
    const aggVals = aggLabels.map(k => agg[k])
    const sorted = [...aggLabels.map((l, i) => ({ l, v: aggVals[i] }))].sort((a, b) => b.v - a.v)
    const cols = sorted.map((_, i) => hexToRgba(color, Math.max(0.9 - i * 0.08, 0.25)))
    const opts = buildBaseOptions(vis)
    opts.indexAxis = 'y'
    return {
      type: 'bar',
      data: { labels: sorted.map(s => s.l), datasets: [{ data: sorted.map(s => s.v), backgroundColor: cols, borderRadius: 4, borderSkipped: false }] },
      options: opts,
    }
  }

  // ── DEFAULT fallback ──
  return {
    type: 'bar',
    data: { labels, datasets: [{ data: vals, backgroundColor: hexToRgba(color, op), borderRadius: radius, borderSkipped: false }] },
    options: buildBaseOptions(vis),
  }
}
