import type { ChartData, ChartOptions, ChartType as ChartJSType } from 'chart.js'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ParsedTable {
  headers: string[]
  rows: string[][]
  rowCount: number
  colCount: number
}

export type ColumnType = 'date' | 'integer' | 'decimal' | 'text'

export interface VisualConfig {
  color?: string
  opacity?: number      // 0–100 integer
  showGrid?: boolean
  smooth?: boolean
  cornerRadius?: number // 0–12 integer
}

export interface ChartStats {
  total: string
  peak: string
  avg: string
}

// ── Chart type catalogue ──────────────────────────────────────────────────────

export const CHART_TYPES = [
  { value: 'bar-vertical',   label: 'Bar (vertical)',   group: 'Comparison' },
  { value: 'bar-horizontal', label: 'Bar (horizontal)', group: 'Comparison' },
  { value: 'bar-grouped',    label: 'Grouped bar',      group: 'Comparison' },
  { value: 'bar-stacked',    label: 'Stacked bar',      group: 'Comparison' },
  { value: 'lollipop',       label: 'Lollipop',         group: 'Comparison' },
  { value: 'line',           label: 'Line',             group: 'Trend' },
  { value: 'line-multi',     label: 'Multi-line',       group: 'Trend' },
  { value: 'area',           label: 'Area',             group: 'Trend' },
  { value: 'area-stacked',   label: 'Stacked area',     group: 'Trend' },
  { value: 'step',           label: 'Step line',        group: 'Trend' },
  { value: 'pie',            label: 'Pie',              group: 'Part-to-whole' },
  { value: 'doughnut',       label: 'Donut',            group: 'Part-to-whole' },
  { value: 'treemap',        label: 'Treemap',          group: 'Part-to-whole' },
  { value: 'waffle',         label: 'Waffle',           group: 'Part-to-whole' },
  { value: 'histogram',      label: 'Histogram',        group: 'Distribution' },
  { value: 'scatter',        label: 'Scatter',          group: 'Correlation' },
  { value: 'bubble',         label: 'Bubble',           group: 'Correlation' },
  { value: 'heatmap',        label: 'Heatmap',          group: 'Correlation' },
  { value: 'candlestick',    label: 'Candlestick',      group: 'Financial' },
  { value: 'waterfall',      label: 'Waterfall',        group: 'Financial' },
  { value: 'funnel',         label: 'Funnel',           group: 'Flow' },
  { value: 'radar',          label: 'Radar',            group: 'Other' },
  { value: 'bar-line',       label: 'Bar + Line',       group: 'Other' },
] as const

export const CHART_COLUMN_ROLES: Record<string, string[]> = {
  'bar-vertical':   ['X Axis (categories)', 'Y Axis (values)'],
  'bar-horizontal': ['Y Axis (categories)', 'X Axis (values)'],
  'bar-grouped':    ['X Axis (categories)', 'Series 1', 'Series 2', 'Series 3 (opt)'],
  'bar-stacked':    ['X Axis (categories)', 'Series 1', 'Series 2', 'Series 3 (opt)'],
  'line':           ['X Axis (date/time)', 'Y Axis (values)'],
  'line-multi':     ['X Axis (date/time)', 'Line 1', 'Line 2', 'Line 3 (opt)'],
  'area':           ['X Axis', 'Y Axis (values)'],
  'area-stacked':   ['X Axis', 'Series 1', 'Series 2'],
  'step':           ['X Axis', 'Y Axis'],
  'scatter':        ['X Values', 'Y Values'],
  'bubble':         ['X Values', 'Y Values', 'Size'],
  'pie':            ['Labels', 'Values'],
  'doughnut':       ['Labels', 'Values'],
  'histogram':      ['Values'],
  'heatmap':        ['X Axis', 'Y Axis', 'Values'],
  'candlestick':    ['Date', 'Open', 'High', 'Low', 'Close'],
  'waterfall':      ['Labels', 'Values'],
  'funnel':         ['Stages', 'Values'],
  'radar':          ['Dimension', 'Values'],
  'treemap':        ['Category', 'Values'],
  'waffle':         ['Labels', 'Values'],
  'lollipop':       ['Labels', 'Values'],
  'bar-line':       ['X Axis', 'Bar Values', 'Line Values'],
}

// These types need plugins not bundled with Chart.js
export const UNSUPPORTED_CHART_TYPES = new Set(['treemap', 'waffle', 'heatmap', 'candlestick'])

// ── Parsing ───────────────────────────────────────────────────────────────────

export function parseRawText(raw: string): ParsedTable {
  const delimiter = raw.includes('\t') ? '\t' : ','

  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length < 2) {
    throw new Error('Need at least a header row and one data row')
  }

  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue }
      if (char === delimiter && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cells.push(current.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow)

  return { headers, rows, rowCount: lines.length, colCount: headers.length }
}

export function detectColumnType(values: string[]): ColumnType {
  const sample = values.filter(v => v.trim()).slice(0, 10)
  if (sample.length === 0) return 'text'

  const datePattern = /^(\d{4}[-/]\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|\d{1,2}[-/]\d{1,2})/i
  if (sample.every(v => datePattern.test(v.trim()))) return 'date'

  const cleanNum = (v: string) => v.replace(/,/g, '').trim()
  if (sample.every(v => /^-?\d+$/.test(cleanNum(v)))) return 'integer'
  if (sample.every(v => !isNaN(parseFloat(cleanNum(v))))) return 'decimal'

  return 'text'
}

export function suggestChartType(table: ParsedTable, colTypes: ColumnType[]): string {
  const hasDate     = colTypes.includes('date')
  const numericCols = colTypes.filter(t => t === 'integer' || t === 'decimal').length
  const hasOHLC     = table.colCount >= 5 &&
    colTypes[1] === 'decimal' && colTypes[2] === 'decimal' &&
    colTypes[3] === 'decimal' && colTypes[4] === 'decimal'

  if (hasOHLC) return 'candlestick'
  if (hasDate && numericCols === 1) return 'line'
  if (hasDate && numericCols > 1) return 'line-multi'
  if (!hasDate && numericCols === 1 && table.rows.length <= 8) return 'bar-vertical'
  if (!hasDate && numericCols === 1 && table.rows.length > 8) return 'bar-horizontal'
  if (!hasDate && numericCols > 1) return 'bar-grouped'
  if (numericCols === 2) return 'scatter'
  return 'bar-vertical'
}

// ── Color utilities ───────────────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function generateColorScale(base: string, n: number): string[] {
  const alphas = [1, 0.75, 0.55, 0.4, 0.3, 0.2, 0.15]
  return Array.from({ length: n }, (_, i) => hexToRgba(base, alphas[i % alphas.length]))
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function computeStats(values: number[]): ChartStats | null {
  if (!values.length) return null
  const total = values.reduce((a, b) => a + b, 0)
  const peak = Math.max(...values)
  const avg = total / values.length
  const fmt = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    if (n % 1 !== 0) return n.toFixed(1)
    return n.toString()
  }
  return { total: fmt(total), peak: fmt(peak), avg: fmt(avg) }
}

// ── Chart.js type mapping ─────────────────────────────────────────────────────

export function mapToChartJSType(plotType: string): ChartJSType {
  const map: Record<string, ChartJSType> = {
    'bar-vertical':  'bar',
    'bar-horizontal':'bar',
    'bar-grouped':   'bar',
    'bar-stacked':   'bar',
    'lollipop':      'bar',
    'line':          'line',
    'line-multi':    'line',
    'area':          'line',
    'area-stacked':  'line',
    'step':          'line',
    'pie':           'pie',
    'doughnut':      'doughnut',
    'scatter':       'scatter',
    'bubble':        'bubble',
    'histogram':     'bar',
    'funnel':        'bar',
    'waterfall':     'bar',
    'radar':         'radar',
    'bar-line':      'bar',
  }
  return (map[plotType] || 'bar') as ChartJSType
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function tooltipConfig() {
  return {
    backgroundColor: '#111111',
    titleColor: '#FFFFFF',
    bodyColor: '#CCCCCC',
    titleFont: { family: 'Syne', size: 12, weight: 'bold' as const },
    bodyFont: { family: 'IBM Plex Mono', size: 11 },
    padding: 10,
    cornerRadius: 6,
    displayColors: false,
  }
}

function baseOptions(config: VisualConfig, indexAxis: 'x' | 'y' = 'x') {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: indexAxis as 'x' | 'y',
    animation: { duration: 300, easing: 'easeInOutQuart' as const },
    plugins: {
      legend: { display: false },
      tooltip: tooltipConfig(),
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { family: 'IBM Plex Mono', size: 10 },
          color: '#AAAAAA',
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: {
          display: config.showGrid ?? true,
          color: '#F0F0F0',
          lineWidth: 1,
        },
        border: { display: false },
        beginAtZero: true,
        ticks: {
          font: { family: 'IBM Plex Mono', size: 10 },
          color: '#AAAAAA',
          padding: 8,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (v: any) => {
            const n = Number(v)
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
            return n
          },
        },
      },
    },
  }
}

function buildHistogramBins(values: number[], binCount: number) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binSize = (max - min) / binCount || 1
  const bins = Array.from({ length: binCount }, (_, i) => ({
    min: min + i * binSize,
    max: min + (i + 1) * binSize,
    count: 0,
  }))
  values.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1)
    bins[idx].count++
  })
  return bins
}

// ── buildChartData ────────────────────────────────────────────────────────────

export function buildChartData(
  table: ParsedTable,
  colTypes: ColumnType[],
  chartType: string,
  assignments: Record<number, number>,
  config: VisualConfig
): { data: ChartData; options: ChartOptions } {

  const getCol = (roleIndex: number): string[] => {
    const colIndex = assignments[roleIndex]
    if (colIndex === undefined || colIndex === -1) return []
    return table.rows.map(row => row[colIndex] ?? '')
  }

  const parseValues = (raw: string[]): number[] =>
    raw.map(v => {
      const n = parseFloat(v.replace(/,/g, '').trim())
      return isNaN(n) ? 0 : n
    })

  const color   = config.color || '#1D6EE8'
  const opacity = (config.opacity ?? 85) / 100

  // ── Bar (vertical / horizontal / lollipop) ──────────────────────────────
  if (['bar-vertical', 'bar-horizontal', 'lollipop'].includes(chartType)) {
    const labels = getCol(0)
    const values = parseValues(getCol(1))
    return {
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: hexToRgba(color, opacity),
          borderColor: color,
          borderWidth: chartType === 'lollipop' ? 2 : 0,
          borderRadius: config.cornerRadius ?? 4,
          borderSkipped: false as const,
        }],
      },
      options: baseOptions(config, chartType === 'bar-horizontal' ? 'y' : 'x') as ChartOptions,
    }
  }

  // ── Grouped / stacked bar ────────────────────────────────────────────────
  if (['bar-grouped', 'bar-stacked'].includes(chartType)) {
    const labels = getCol(0)
    const seriesColors = [color, hexToRgba(color, 0.65), hexToRgba(color, 0.4)]
    const datasets = [1, 2, 3]
      .filter(i => assignments[i] !== undefined && assignments[i] !== -1)
      .map((i, idx) => ({
        label: table.headers[assignments[i]] || `Series ${idx + 1}`,
        data: parseValues(getCol(i)),
        backgroundColor: seriesColors[idx],
        borderRadius: config.cornerRadius ?? 4,
        borderSkipped: false as const,
      }))
    const opts = baseOptions(config, 'x')
    return {
      data: { labels, datasets },
      options: {
        ...opts,
        plugins: {
          ...opts.plugins,
          legend: { display: true, position: 'bottom' as const,
            labels: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#888' } },
        },
        scales: {
          ...opts.scales,
          x: { ...opts.scales.x, stacked: chartType === 'bar-stacked' },
          y: { ...opts.scales.y, stacked: chartType === 'bar-stacked' },
        },
      } as ChartOptions,
    }
  }

  // ── Line / Area / Step ───────────────────────────────────────────────────
  if (['line', 'area', 'step'].includes(chartType)) {
    const labels = getCol(0)
    const values = parseValues(getCol(1))
    return {
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: color,
          borderWidth: 2.5,
          backgroundColor: hexToRgba(color, chartType === 'area' ? 0.12 : 0),
          fill: chartType === 'area',
          tension: config.smooth ? 0.4 : 0,
          stepped: chartType === 'step' ? ('before' as const) : false,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: baseOptions(config, 'x') as ChartOptions,
    }
  }

  // ── Stacked area ─────────────────────────────────────────────────────────
  if (chartType === 'area-stacked') {
    const labels = getCol(0)
    const seriesColors = [color, hexToRgba(color, 0.65)]
    const datasets = [1, 2]
      .filter(i => assignments[i] !== undefined && assignments[i] !== -1)
      .map((i, idx) => ({
        label: table.headers[assignments[i]] || `Series ${idx + 1}`,
        data: parseValues(getCol(i)),
        borderColor: seriesColors[idx],
        backgroundColor: hexToRgba(color, idx === 0 ? 0.4 : 0.25),
        fill: true,
        tension: config.smooth ? 0.4 : 0,
        pointRadius: 3,
      }))
    const opts = baseOptions(config, 'x')
    return {
      data: { labels, datasets },
      options: {
        ...opts,
        plugins: {
          ...opts.plugins,
          legend: { display: true, position: 'bottom' as const },
        },
        scales: { ...opts.scales, y: { ...opts.scales.y, stacked: true } },
      } as ChartOptions,
    }
  }

  // ── Multi-line ───────────────────────────────────────────────────────────
  if (chartType === 'line-multi') {
    const labels = getCol(0)
    const seriesColors = generateColorScale(color, 4)
    const datasets = [1, 2, 3, 4]
      .filter(i => assignments[i] !== undefined && assignments[i] !== -1)
      .map((i, idx) => ({
        label: table.headers[assignments[i]] || `Series ${idx + 1}`,
        data: parseValues(getCol(i)),
        borderColor: seriesColors[idx],
        borderWidth: 2,
        backgroundColor: hexToRgba(color, 0.08),
        fill: false,
        tension: config.smooth ? 0.4 : 0,
        pointBackgroundColor: seriesColors[idx],
        pointRadius: 3,
        pointHoverRadius: 5,
      }))
    const opts = baseOptions(config, 'x')
    return {
      data: { labels, datasets },
      options: {
        ...opts,
        plugins: {
          ...opts.plugins,
          legend: { display: true, position: 'bottom' as const },
        },
      } as ChartOptions,
    }
  }

  // ── Scatter ──────────────────────────────────────────────────────────────
  if (chartType === 'scatter') {
    const xs = parseValues(getCol(0))
    const ys = parseValues(getCol(1))
    return {
      data: {
        datasets: [{
          data: xs.map((x, i) => ({ x, y: ys[i] ?? 0 })),
          backgroundColor: hexToRgba(color, opacity),
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: tooltipConfig() },
        scales: {
          x: { type: 'linear' as const, grid: { display: false }, border: { display: false },
            ticks: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#AAAAAA' } },
          y: { beginAtZero: false, grid: { display: config.showGrid ?? true, color: '#F0F0F0' },
            border: { display: false },
            ticks: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#AAAAAA' } },
        },
      } as ChartOptions,
    }
  }

  // ── Bubble ───────────────────────────────────────────────────────────────
  if (chartType === 'bubble') {
    const xs    = parseValues(getCol(0))
    const ys    = parseValues(getCol(1))
    const sizes = getCol(2).length > 0 ? parseValues(getCol(2)) : xs.map(() => 10)
    const maxSz = Math.max(...sizes, 1)
    return {
      data: {
        datasets: [{
          data: xs.map((x, i) => ({ x, y: ys[i] ?? 0, r: Math.max(3, (sizes[i] / maxSz) * 20) })),
          backgroundColor: hexToRgba(color, opacity * 0.8),
          borderColor: color,
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: tooltipConfig() },
        scales: {
          x: { type: 'linear' as const, grid: { display: false },
            ticks: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#AAAAAA' } },
          y: { beginAtZero: false, grid: { display: config.showGrid ?? true, color: '#F0F0F0' },
            ticks: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#AAAAAA' } },
        },
      } as ChartOptions,
    }
  }

  // ── Pie / Donut ──────────────────────────────────────────────────────────
  if (['pie', 'doughnut'].includes(chartType)) {
    const labels = getCol(0)
    const values = parseValues(getCol(1))
    return {
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: generateColorScale(color, values.length),
          borderColor: '#fff',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: chartType === 'doughnut' ? '60%' : '0%',
        animation: { duration: 300 },
        plugins: {
          legend: {
            display: true,
            position: 'right' as const,
            labels: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#888', boxWidth: 10 },
          },
          tooltip: tooltipConfig(),
        },
      } as ChartOptions,
    }
  }

  // ── Funnel (horizontal bar, sorted desc) ─────────────────────────────────
  if (chartType === 'funnel') {
    const labels = getCol(0)
    const values = parseValues(getCol(1))
    const paired = labels.map((l, i) => ({ l, v: values[i] })).sort((a, b) => b.v - a.v)
    return {
      data: {
        labels: paired.map(s => s.l),
        datasets: [{
          data: paired.map(s => s.v),
          backgroundColor: generateColorScale(color, paired.length),
          borderRadius: 4,
          borderSkipped: false as const,
        }],
      },
      options: { ...baseOptions(config, 'y'), indexAxis: 'y' as const } as ChartOptions,
    }
  }

  // ── Waterfall ────────────────────────────────────────────────────────────
  if (chartType === 'waterfall') {
    const labels = getCol(0)
    const values = parseValues(getCol(1))
    const starts: number[] = []
    let running = 0
    values.forEach(v => { starts.push(v >= 0 ? running : running + v); running += v })
    const opts = baseOptions(config, 'x')
    return {
      data: {
        labels,
        datasets: [
          { data: starts, backgroundColor: 'rgba(0,0,0,0)', borderColor: 'rgba(0,0,0,0)', borderWidth: 0, borderSkipped: false as const },
          {
            data: values.map(v => Math.abs(v)),
            backgroundColor: values.map(v => v >= 0 ? hexToRgba(color, opacity) : hexToRgba('#E24B4A', opacity)),
            borderRadius: config.cornerRadius ?? 4,
            borderSkipped: false as const,
          },
        ],
      },
      options: {
        ...opts,
        scales: { ...opts.scales, y: { ...opts.scales.y, stacked: true } },
      } as ChartOptions,
    }
  }

  // ── Histogram ────────────────────────────────────────────────────────────
  if (chartType === 'histogram') {
    const values = parseValues(getCol(0))
    const bins = buildHistogramBins(values, 10)
    return {
      data: {
        labels: bins.map(b => `${b.min.toFixed(0)}–${b.max.toFixed(0)}`),
        datasets: [{
          data: bins.map(b => b.count),
          backgroundColor: hexToRgba(color, opacity),
          borderColor: color,
          borderWidth: 1,
          borderRadius: 0,
          borderSkipped: false as const,
        }],
      },
      options: baseOptions(config, 'x') as ChartOptions,
    }
  }

  // ── Radar ────────────────────────────────────────────────────────────────
  if (chartType === 'radar') {
    const labels = getCol(0)
    const values = parseValues(getCol(1))
    return {
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.15),
          pointBackgroundColor: color,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          r: {
            ticks: { font: { family: 'IBM Plex Mono', size: 9 }, color: '#AAAAAA' },
            grid: { color: '#F0F0F0' },
            pointLabels: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#888888' },
          },
        },
        plugins: { legend: { display: false }, tooltip: tooltipConfig() },
      } as ChartOptions,
    }
  }

  // ── Bar + Line (mixed) ───────────────────────────────────────────────────
  if (chartType === 'bar-line') {
    const labels    = getCol(0)
    const barValues = parseValues(getCol(1))
    const lineValues= parseValues(getCol(2))
    const opts = baseOptions(config, 'x')
    return {
      data: {
        labels,
        datasets: [
          {
            type: 'bar' as const,
            label: table.headers[assignments[1]] || 'Bar',
            data: barValues,
            backgroundColor: hexToRgba(color, opacity),
            borderRadius: config.cornerRadius ?? 4,
            borderSkipped: false as const,
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: table.headers[assignments[2]] || 'Line',
            data: lineValues,
            borderColor: '#E24B4A',
            backgroundColor: 'rgba(0,0,0,0)',
            borderWidth: 2,
            pointBackgroundColor: '#E24B4A',
            pointRadius: 4,
            fill: false,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        ...opts,
        plugins: {
          ...opts.plugins,
          legend: { display: true, position: 'bottom' as const },
        },
        scales: {
          ...opts.scales,
          y:  { ...opts.scales.y, position: 'left' as const },
          y1: { type: 'linear' as const, position: 'right' as const,
            grid: { display: false },
            ticks: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#AAAAAA' } },
        },
      } as ChartOptions,
    }
  }

  // ── Default fallback ─────────────────────────────────────────────────────
  const labels = getCol(0)
  const values = parseValues(getCol(1))
  return {
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: hexToRgba(color, opacity),
        borderRadius: config.cornerRadius ?? 4,
      }],
    },
    options: baseOptions(config, 'x') as ChartOptions,
  }
}
