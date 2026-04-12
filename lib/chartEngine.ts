import type { ChartType as ChartJSType } from 'chart.js'

export type PlotChartType = 'bar' | 'line' | 'doughnut' | 'scatter'

export interface ParsedData {
  labels: string[]
  values: number[]
  rawRows: number
}

export interface ChartConfig {
  color?:        string   // Hex string. Default: '#1D6EE8'
  opacity?:      number   // Integer 0–100. MUST divide by 100 before use.
  cornerRadius?: number   // Integer 0–12. Bar chart only.
  showGrid?:     boolean  // Y-axis grid lines. Default: true
  smooth?:       boolean  // Line tension. Default: false
  showLegend?:   boolean  // Default: false (true forced on doughnut)
}

export interface ChartStats {
  total: string
  peak: string
  avg: string
}

// Parse CSV string → labels + values
export function parseCSV(raw: string): ParsedData {
  const labels: string[] = []
  const values: number[] = []

  const lines = raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false
      // Skip header row — any row where first cell is "label" (case-insensitive)
      const firstCell = line.split(',')[0].trim().toLowerCase()
      return firstCell !== 'label'
    })

  for (const line of lines) {
    // Split on first comma only — labels may contain commas if quoted
    const commaIndex = line.indexOf(',')
    if (commaIndex === -1) continue  // Skip lines with no comma

    const label = line.slice(0, commaIndex).trim()
    const rawValue = line.slice(commaIndex + 1).trim()

    // Handle values with commas (e.g., "1,234" — strip commas from numbers)
    const cleanValue = rawValue.replace(/,/g, '')
    const value = parseFloat(cleanValue)

    if (label && !isNaN(value)) {
      labels.push(label)
      values.push(value)
    }
    // If value is NaN: skip the row, do not push a 0
  }

  return { labels, values, rawRows: lines.length }
}

// Auto-detect best chart type from data shape
export function detectChartType(labels: string[], values: number[]): PlotChartType {
  if (labels.length === 0) return 'bar'  // Default for empty data

  const firstLabel = labels[0].toLowerCase().trim()

  // Rule 1: Time series → Line chart
  const isTimeSeries = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|20\d\d|\d{4}[-/]\d{2}|\d{2}[-/]\d{4})/.test(firstLabel)
  if (isTimeSeries) return 'line'

  // Rule 2: Percentage composition → Doughnut
  const allPercent = values.every(v => v >= 0 && v <= 100)
  const sumNearHundred = Math.abs(values.reduce((a, b) => a + b, 0) - 100) < 15
  const fewCategories = labels.length >= 2 && labels.length <= 8
  if (allPercent && sumNearHundred && fewCategories) return 'doughnut'

  // Rule 3: Two numeric columns with no obvious labels → Scatter
  const labelsAreNumeric = labels.every(l => !isNaN(parseFloat(l)))
  if (labelsAreNumeric && values.length >= 3) return 'scatter'

  // Default → Bar
  return 'bar'
}

// Compute summary stats from values array
export function computeStats(values: number[]): ChartStats {
  if (values.length === 0) {
    return { total: '—', peak: '—', avg: '—' }
  }

  const total = values.reduce((sum, v) => sum + v, 0)
  const peak = Math.max(...values)
  const avg = total / values.length

  const fmt = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    if (n % 1 !== 0) return n.toFixed(1)
    return n.toString()
  }

  return {
    total: fmt(total),
    peak: fmt(peak),
    avg: fmt(avg),
  }
}

// Hex color → rgba string (alpha is 0–1 float)
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Generates an array of 7 colour variants for doughnut segments
function generateDoughnutColors(hex: string): string[] {
  return [
    hex,
    hexToRgba(hex, 0.75),
    hexToRgba(hex, 0.55),
    hexToRgba(hex, 0.40),
    '#E4E4E4',
    '#C8C8C8',
    '#AAAAAA',
  ]
}

// Build Chart.js config — always uses Signal theme defaults
export function buildChartConfig(
  type: PlotChartType,
  labels: string[],
  values: number[],
  config: ChartConfig = {}
) {
  const {
    color        = '#1D6EE8',
    opacity      = 85,
    cornerRadius = 4,
    showGrid     = true,
    smooth       = false,
    showLegend   = false,
  } = config

  // CRITICAL: opacity is 0–100, Chart.js rgba() expects 0–1
  const opacityDecimal = opacity / 100

  const isDoughnut = type === 'doughnut'
  const isLine     = type === 'line'
  const isScatter  = type === 'scatter'

  const scatterData = labels.map((_, i) => ({ x: i + 1, y: values[i] }))

  const dataset = {
    label: 'Value',

    // Scatter uses {x,y} objects; others use plain numbers
    data: isScatter ? scatterData : values,

    // Background colour
    backgroundColor: isDoughnut
      ? generateDoughnutColors(color)
      : isLine
      ? hexToRgba(color, 0.12)
      : hexToRgba(color, opacityDecimal),

    // Border
    borderColor: isDoughnut ? '#FFFFFF' : color,
    borderWidth: isDoughnut ? 2 : isLine ? 2.5 : 0,

    // Bar-specific
    borderRadius: (!isDoughnut && !isLine && !isScatter) ? cornerRadius : 0,
    borderSkipped: false,

    // Line-specific
    fill: isLine,
    tension: smooth ? 0.4 : 0.0,

    // Point styling (line and scatter)
    pointBackgroundColor: color,
    pointBorderColor: '#FFFFFF',
    pointBorderWidth: 2,
    pointRadius: (isLine || isScatter) ? 4 : 0,
    pointHoverRadius: (isLine || isScatter) ? 6 : 0,
    pointHoverBackgroundColor: color,

    // Hover (bars)
    hoverBackgroundColor: isDoughnut
      ? undefined
      : hexToRgba(color, Math.min(opacityDecimal + 0.15, 1)),
  }

  const data = {
    labels: isScatter ? labels.map((_, i) => i + 1) : labels,
    datasets: [dataset],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
      duration: 250,
      easing: 'easeInOutQuart' as const,
    },

    plugins: {
      legend: {
        display: isDoughnut ? true : showLegend,
        position: 'bottom' as const,
        labels: {
          font: { family: 'IBM Plex Mono', size: 10 },
          color: '#888888',
          padding: 16,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },

      tooltip: {
        enabled: true,
        backgroundColor: '#111111',
        titleColor: '#FFFFFF',
        bodyColor: '#CCCCCC',
        titleFont: { family: 'Syne', size: 12, weight: 'bold' as const },
        bodyFont: { family: 'IBM Plex Mono', size: 11 },
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            if (isDoughnut) {
              const total = context.chart.data.datasets[0].data.reduce(
                (sum: number, v: number) => sum + v, 0
              )
              const pct = ((context.raw / total) * 100).toFixed(1)
              return ` ${context.raw} (${pct}%)`
            }
            return ` ${context.formattedValue}`
          },
        },
      },
    },

    // Scales — hidden on doughnut, shown on everything else
    scales: isDoughnut ? {} : {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: { family: 'IBM Plex Mono', size: 10 },
          color: '#AAAAAA',
          padding: 8,
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
        },
        ...(isScatter ? { type: 'linear' as const } : {}),
      },
      y: {
        grid: {
          display: showGrid,
          color: '#F0F0F0',
          lineWidth: 1,
        },
        border: {
          display: false,
          dash: [4, 4],
        },
        ticks: {
          font: { family: 'IBM Plex Mono', size: 10 },
          color: '#AAAAAA',
          padding: 10,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (value: any) => {
            const n = Number(value)
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
            return n
          },
        },
        beginAtZero: true,
      },
    },
  }

  return { data, options }
}

// Map PlotChartType to Chart.js type name
export function getChartJSType(type: PlotChartType): ChartJSType {
  const map: Record<PlotChartType, ChartJSType> = {
    bar:      'bar',
    line:     'line',
    doughnut: 'doughnut',
    scatter:  'scatter',
  }
  return map[type]
}
