'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Chart as ChartJS, registerables } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'
import { parseCSV, detectChartType, buildChartConfig, computeStats, type PlotChartType } from '@/lib/chartEngine'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Register Chart.js components
ChartJS.register(...registerables)

const CHART_TYPES: { type: PlotChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="8" width="3" height="7"/><rect x="6.5" y="4" width="3" height="11"/><rect x="12" y="1" width="3" height="14"/></svg> },
  { type: 'line', label: 'Line', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1,12 5,6 10,9 15,3"/></svg> },
  { type: 'doughnut', label: 'Donut', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a3 3 0 110 6 3 3 0 010-6z"/></svg> },
  { type: 'scatter', label: 'Scatter', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="10" r="2"/><circle cx="8" cy="5" r="2"/><circle cx="12" cy="8" r="2"/></svg> },
]

const COLOR_PALETTE = ['#1D6EE8', '#111111', '#F0A500', '#10B981', '#E24B4A', '#7C3AED']

const DEFAULT_CSV = `Label, Value
Jan, 42
Feb, 67
Mar, 38
Apr, 91
May, 55
Jun, 74`

function EditorContent() {
  const searchParams = useSearchParams()
  const chartId = searchParams.get('id')
  const chartRef = useRef<ChartJS | null>(null)

  // State
  const [csvData, setCsvData] = useState(DEFAULT_CSV)
  const [chartType, setChartType] = useState<PlotChartType>('bar')
  const [selectedColor, setSelectedColor] = useState('#1D6EE8')
  const [opacity, setOpacity] = useState(85)
  const [cornerRadius, setCornerRadius] = useState(4)
  const [showGrid, setShowGrid] = useState(true)
  const [smooth, setSmooth] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [headline, setHeadline] = useState('')
  const [caption, setCaption] = useState('')
  const [overlayPosition, setOverlayPosition] = useState<'bottom' | 'top'>('bottom')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png')
  const [exportRes, setExportRes] = useState<1 | 2 | 3>(1)
  const [exportBg, setExportBg] = useState<'white' | 'offwhite' | 'dark' | 'transparent'>('white')
  const [includeOverlay, setIncludeOverlay] = useState(true)
  const [includeWatermark, setIncludeWatermark] = useState(true)

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'chart-type': true,
    'data': true,
    'visual': true,
    'social': false,
  })

  // Parse data and compute chart config
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

  // Auto-detect on data change
  useEffect(() => {
    if (csvData !== DEFAULT_CSV) {
      setChartType(detectedType)
    }
  }, [csvData, detectedType])

  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Export PNG
  const handleExportPNG = () => {
    const canvas = chartRef.current?.canvas
    if (!canvas) return

    const scale = exportRes
    const w = canvas.width * scale
    const h = canvas.height * scale
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = w
    exportCanvas.height = h
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // Background
    if (exportBg !== 'transparent') {
      ctx.fillStyle = exportBg === 'white' ? '#FFFFFF' : exportBg === 'offwhite' ? '#FAFAFA' : '#111111'
      ctx.fillRect(0, 0, w, h)
    }

    ctx.drawImage(canvas, 0, 0, w, h)

    // Watermark
    if (includeWatermark) {
      ctx.font = `${10 * scale}px IBM Plex Mono`
      ctx.fillStyle = exportBg === 'dark' ? '#555555' : '#C8C8C8'
      ctx.fillText('Made with Plot', 12 * scale, h - 12 * scale)
    }

    const link = document.createElement('a')
    link.download = `chart-${Date.now()}.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
    setShowExportModal(false)
  }

  // Export SVG (simplified)
  const handleExportSVG = () => {
    const canvas = chartRef.current?.canvas
    if (!canvas) return

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <img src="${canvas.toDataURL('image/png')}" width="${canvas.width}" height="${canvas.height}" />
        </div>
      </foreignObject>
    </svg>`

    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = `chart-${Date.now()}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    setShowExportModal(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Nav showDashboardBack showExport onExport={() => setShowExportModal(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-[272px] min-w-[272px] bg-surface border-r border-border overflow-y-auto">
          {/* Chart Type */}
          <div className="border-b border-[#F0F0F0]">
            <button onClick={() => toggleSection('chart-type')} className="w-full px-3 py-2.5 flex items-center justify-between text-[10px] font-mono uppercase text-muted tracking-[0.1em]">
              Chart type
              <span className={cn('transition-transform', openSections['chart-type'] && 'rotate-180')}>▾</span>
            </button>
            {openSections['chart-type'] && (
              <div className="px-3 pb-3 grid grid-cols-4 gap-1.5">
                {CHART_TYPES.map(ct => (
                  <button
                    key={ct.type}
                    onClick={() => setChartType(ct.type)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-[6px] border transition-all',
                      chartType === ct.type ? 'bg-text text-white border-text' : 'bg-bg text-muted border-border hover:border-border-strong'
                    )}
                  >
                    {ct.icon}
                    <span className="text-[8px] font-mono">{ct.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data */}
          <div className="border-b border-[#F0F0F0]">
            <button onClick={() => toggleSection('data')} className="w-full px-3 py-2.5 flex items-center justify-between text-[10px] font-mono uppercase text-muted tracking-[0.1em]">
              Data
              <span className={cn('transition-transform', openSections['data'] && 'rotate-180')}>▾</span>
            </button>
            {openSections['data'] && (
              <div className="px-3 pb-3">
                <textarea
                  value={csvData}
                  onChange={e => setCsvData(e.target.value)}
                  className="w-full h-[140px] text-[11px] font-mono p-2.5 border border-border rounded-[6px] bg-bg resize-none outline-none focus:border-blue transition-colors"
                  placeholder="Label, Value"
                />
                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-mono text-muted">
                  <span className="px-1.5 py-0.5 bg-blue-bg text-blue-dark rounded">Auto: {detectedType}</span>
                  <span>{rawRows} rows</span>
                </div>
              </div>
            )}
          </div>

          {/* Visual Style */}
          <div className="border-b border-[#F0F0F0]">
            <button onClick={() => toggleSection('visual')} className="w-full px-3 py-2.5 flex items-center justify-between text-[10px] font-mono uppercase text-muted tracking-[0.1em]">
              Visual style
              <span className={cn('transition-transform', openSections['visual'] && 'rotate-180')}>▾</span>
            </button>
            {openSections['visual'] && (
              <div className="px-3 pb-3 flex flex-col gap-3">
                {/* Color palette */}
                <div>
                  <label className="block text-[9px] font-mono text-muted mb-1.5">Color</label>
                  <div className="flex items-center gap-1.5">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={cn('w-5 h-5 rounded-full border-2 transition-all', selectedColor === c ? 'border-text scale-110' : 'border-transparent')}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-[9px] font-mono text-muted mb-1.5">Opacity: {opacity}%</label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={opacity}
                    onChange={e => setOpacity(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>

                {/* Corner radius */}
                <div>
                  <label className="block text-[9px] font-mono text-muted mb-1.5">Corner radius: {cornerRadius}px</label>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={cornerRadius}
                    onChange={e => setCornerRadius(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted">Show grid</span>
                  <button onClick={() => setShowGrid(!showGrid)} className={cn('w-[30px] h-[17px] rounded-full relative transition-colors', showGrid ? 'bg-text' : 'bg-faint')}>
                    <span className={cn('absolute w-[13px] h-[13px] bg-white rounded-full top-[2px] left-[2px] transition-transform', showGrid && 'translate-x-[13px]')} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted">Smooth lines</span>
                  <button onClick={() => setSmooth(!smooth)} className={cn('w-[30px] h-[17px] rounded-full relative transition-colors', smooth ? 'bg-text' : 'bg-faint')}>
                    <span className={cn('absolute w-[13px] h-[13px] bg-white rounded-full top-[2px] left-[2px] transition-transform', smooth && 'translate-x-[13px]')} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Social Overlay */}
          <div className="border-b border-[#F0F0F0]">
            <button onClick={() => toggleSection('social')} className="w-full px-3 py-2.5 flex items-center justify-between text-[10px] font-mono uppercase text-muted tracking-[0.1em]">
              Social overlay
              <span className={cn('transition-transform', openSections['social'] && 'rotate-180')}>▾</span>
            </button>
            {openSections['social'] && (
              <div className="px-3 pb-3 flex flex-col gap-3">
                <p className="text-[9px] font-mono text-muted">Add a headline and caption over your chart for social sharing.</p>
                <div>
                  <label className="block text-[9px] font-mono text-muted mb-1">Headline</label>
                  <input
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 border border-border rounded-[6px] bg-bg outline-none focus:border-blue transition-colors"
                    placeholder="Q1 Revenue Up 40%"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-muted mb-1">Caption</label>
                  <input
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 border border-border rounded-[6px] bg-bg outline-none focus:border-blue transition-colors"
                    placeholder="Source: Company financials"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted">Position:</span>
                  <button onClick={() => setOverlayPosition('bottom')} className={cn('text-[9px] font-mono px-2 py-1 rounded border', overlayPosition === 'bottom' ? 'bg-text text-white border-text' : 'border-border text-muted')}>Bottom</button>
                  <button onClick={() => setOverlayPosition('top')} className={cn('text-[9px] font-mono px-2 py-1 rounded border', overlayPosition === 'top' ? 'bg-text text-white border-text' : 'border-border text-muted')}>Top</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview */}
        <div className="flex-1 bg-[#F2F2F2] p-5 overflow-auto flex flex-col">
          {/* Title & Subtitle */}
          <div className="mb-4">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-[20px] font-bold tracking-[-0.02em] bg-transparent outline-none placeholder:text-faint"
              placeholder="Chart title"
            />
            <input
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full text-[12px] font-mono text-muted bg-transparent outline-none placeholder:text-faint mt-1"
              placeholder="Subtitle or description"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Peak', value: stats.peak },
              { label: 'Average', value: stats.avg },
            ].map(stat => (
              <div key={stat.label} className="bg-surface border border-border rounded-[8px] p-3">
                <div className="text-[9px] font-mono text-muted uppercase tracking-[0.1em] mb-1">{stat.label}</div>
                <div className="text-[19px] font-bold tracking-[-0.02em]">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Chart Card */}
          <div className="bg-surface border border-border rounded-lg p-5 flex-1 flex flex-col min-h-[300px]">
            <div className="relative flex-1 min-h-[260px]">
              <Chart
                ref={chartRef}
                type={chartType === 'doughnut' ? 'doughnut' : chartType === 'scatter' ? 'scatter' : chartType === 'line' ? 'line' : 'bar'}
                data={data}
                options={options}
              />

              {/* Social Overlay */}
              {(headline || caption) && (
                <div className={cn(
                  'absolute left-0 right-0 bg-white/90 backdrop-blur-sm px-4 py-3 pointer-events-none',
                  overlayPosition === 'bottom' ? 'bottom-0' : 'top-0'
                )}>
                  {headline && <div className="text-[16px] font-bold tracking-[-0.02em]">{headline}</div>}
                  {caption && <div className="text-[10px] font-mono text-muted mt-0.5">{caption}</div>}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-[9px] font-mono text-faint">Made with Plot</span>
              <span className="text-[9px] font-mono text-faint">{rawRows} data points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold tracking-[-0.02em]">Export chart</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-2">
            {/* Format tabs */}
            <div className="flex gap-2">
              <button onClick={() => setExportFormat('png')} className={cn('flex-1 py-2 text-[12px] font-medium rounded-[6px] border transition-all', exportFormat === 'png' ? 'bg-text text-white border-text' : 'border-border text-muted')}>PNG</button>
              <button onClick={() => setExportFormat('svg')} className={cn('flex-1 py-2 text-[12px] font-medium rounded-[6px] border transition-all', exportFormat === 'svg' ? 'bg-text text-white border-text' : 'border-border text-muted')}>SVG</button>
            </div>

            {/* Resolution (PNG only) */}
            {exportFormat === 'png' && (
              <div>
                <label className="block text-[10px] font-mono text-muted mb-1.5 uppercase tracking-[0.1em]">Resolution</label>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setExportRes(r)}
                      className={cn('flex-1 py-2 text-[12px] font-mono rounded-[6px] border transition-all', exportRes === r ? 'bg-blue text-white border-blue' : 'border-border text-muted')}
                    >
                      {r}×
                      {r === 3 && <span className="ml-1 text-[8px] bg-amber-bg text-[#B07800] px-1 py-0.5 rounded">Biz</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background */}
            <div>
              <label className="block text-[10px] font-mono text-muted mb-1.5 uppercase tracking-[0.1em]">Background</label>
              <div className="flex gap-2">
                {(['white', 'offwhite', 'dark', 'transparent'] as const).map(bg => (
                  <button
                    key={bg}
                    onClick={() => setExportBg(bg)}
                    className={cn(
                      'flex-1 py-2 text-[10px] font-mono rounded-[6px] border transition-all capitalize',
                      exportBg === bg ? 'bg-blue text-white border-blue' : 'border-border text-muted',
                      bg === 'dark' && 'bg-[#111] text-white'
                    )}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted">Include social overlay</span>
                <button onClick={() => setIncludeOverlay(!includeOverlay)} className={cn('w-[30px] h-[17px] rounded-full relative transition-colors', includeOverlay ? 'bg-text' : 'bg-faint')}>
                  <span className={cn('absolute w-[13px] h-[13px] bg-white rounded-full top-[2px] left-[2px] transition-transform', includeOverlay && 'translate-x-[13px]')} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted">&quot;Made with Plot&quot; watermark</span>
                <button onClick={() => setIncludeWatermark(!includeWatermark)} className={cn('w-[30px] h-[17px] rounded-full relative transition-colors', includeWatermark ? 'bg-text' : 'bg-faint')}>
                  <span className={cn('absolute w-[13px] h-[13px] bg-white rounded-full top-[2px] left-[2px] transition-transform', includeWatermark && 'translate-x-[13px]')} />
                </button>
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={exportFormat === 'png' ? handleExportPNG : handleExportSVG}
              className="w-full py-2.5 bg-text text-white text-[13px] font-medium rounded-[8px] border border-text hover:bg-[#333] transition-all"
            >
              Download {exportFormat.toUpperCase()}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <EditorContent />
    </Suspense>
  )
}
