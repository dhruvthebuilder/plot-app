import type { ChartType, ChartData, ChartOptions } from 'chart.js'

export type PlotChartType = 'bar' | 'line' | 'doughnut' | 'scatter' | 'bubble'

export interface ParsedData {
  labels: string[]
  values: number[]
  rawRows: number
}

export interface ChartConfig {
  color?: string
  opacity?: number
  cornerRadius?: number
  showGrid?: boolean
  smooth?: boolean
  chartType?: PlotChartType
}

// Parse CSV string → labels + values
export function parseCSV(raw: string): ParsedData {
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.toLowerCase().startsWith('label'))

  const labels: string[] = []
  const values: number[] = []

  for (const line of lines) {
    const parts = line.split(',')
    if (parts.length >= 2) {
      labels.push(parts[0].trim())
      values.push(parseFloat(parts[1].trim()) || 0)
    }
  }

  return { labels, values, rawRows: lines.length }
}

// Auto-detect best chart type from data shape
export function detectChartType(labels: string[], values: number[]): PlotChartType {
  const firstLabel = labels[0]?.toLowerCase() || ''
  const isDate = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|20\d\d|\d{4}/.test(firstLabel)
  const isPercent = values.every(v => v >= 0 && v <= 100) && values.reduce((a, b) => a + b, 0) > 90
  const manyCategories = labels.length > 10

  if (isDate) return 'line'
  if (isPercent && labels.length <= 8) return 'doughnut'
  if (manyCategories) return 'bar'
  return 'bar'
}

// Hex color → rgba string
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Build Chart.js config — always uses Signal theme defaults
export function buildChartConfig(
  type: PlotChartType,
  labels: string[],
  values: number[],
  config: ChartConfig = {}
): { data: ChartData; options: ChartOptions } {
  const {
    color = '#1D6EE8',
    opacity = 85,
    cornerRadius = 4,
    showGrid = true,
    smooth = false,
  } = config

  const isDoughnut = type === 'doughnut'
  const isLine = type === 'line'
  const isScatter = type === 'scatter'

  const doughnutColors = [
    color,
    hexToRgba(color, 0.6),
    '#E4E4E4',
    '#CACACA',
    '#F0F0F0',
    '#AAAAAA',
    hexToRgba(color, 0.3),
  ]

  const data: ChartData = {
    labels: isScatter ? labels.map((_, i) => String(i + 1)) : labels,
    datasets: [
      {
        label: 'Value',
        data: isScatter
          ? labels.map((_, i) => ({ x: i + 1, y: values[i] }))
          : values,
        backgroundColor: isDoughnut
          ? doughnutColors
          : isLine
          ? hexToRgba(color, 0.1)
          : hexToRgba(color, opacity / 100),
        borderColor: isDoughnut ? '#ffffff' : color,
        borderWidth: isDoughnut ? 2 : isLine ? 2.5 : 0,
        borderRadius: !isDoughnut && !isLine ? cornerRadius : 0,
        fill: isLine,
        tension: smooth ? 0.4 : 0,
        pointBackgroundColor: color,
        pointRadius: isLine ? 4 : 5,
        pointHoverRadius: isLine ? 6 : 7,
      } as any,
    ],
  }

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: {
        display: isDoughnut,
        position: 'bottom',
        labels: {
          font: { family: 'IBM Plex Mono', size: 10 },
          color: '#888888',
          padding: 12,
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: '#111111',
        titleFont: { family: 'Syne', size: 12, weight: 'bold' },
        bodyFont: { family: 'IBM Plex Mono', size: 11 },
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
      },
    },
    scales: isDoughnut
      ? {}
      : {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              font: { family: 'IBM Plex Mono', size: 10 },
              color: '#AAAAAA',
              padding: 6,
            },
          },
          y: {
            grid: {
              display: showGrid,
              color: '#F0F0F0',
              lineWidth: 1,
            },
            border: { display: false },
            ticks: {
              font: { family: 'IBM Plex Mono', size: 10 },
              color: '#AAAAAA',
              padding: 8,
            },
          },
        },
  }

  return { data, options }
}

// Compute summary stats from values array
export function computeStats(values: number[]) {
  if (!values.length) return { total: 0, peak: 0, avg: '0' }
  const total = values.reduce((a, b) => a + b, 0)
  const peak = Math.max(...values)
  const avg = (total / values.length).toFixed(1)
  const fmt = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n))
  return { total: fmt(total), peak: fmt(peak), avg }
}
