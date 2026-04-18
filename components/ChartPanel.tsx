'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Candle, ChartTimeframe } from '@/lib/types'
import { formatCompact, calcEMA, calcVWAP, calcMACD } from '@/lib/utils'
import styles from './ChartPanel.module.css'

interface IndicatorState {
  ema9: boolean; ema20: boolean; ema50: boolean; ema100: boolean; ema200: boolean
  vwap: boolean; macd: boolean
}

const EMA_COLORS: Record<string, string> = {
  ema9: '#ffcc00', ema20: '#ff9500', ema50: '#af52de', ema100: '#5ac8fa', ema200: '#ff375f',
}

interface DrawingLine { id: string; y: number }

// ─── Time label formatter ───
function formatTimeLabel(date: Date, tfLabel: string): string {
  if (tfLabel === 'Daily') {
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${m}/${d}`
  }
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// ─── ChartView ───
interface ChartViewProps {
  candles: Candle[]
  label: string
  symbol: string
  indicators: IndicatorState
  onExpand: () => void
}

function ChartView({ candles, label, symbol, indicators, onExpand }: ChartViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [viewStart, setViewStart] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartView, setDragStartView] = useState(0)
  const [drawings, setDrawings] = useState<DrawingLine[]>([])
  const [drawMode, setDrawMode] = useState(false)
  const [hoverCandle, setHoverCandle] = useState<number | null>(null)
  // Trackpad gesture tracking
  const lastTouchDist = useRef<number | null>(null)
  const lastTouchX = useRef<number | null>(null)

  useEffect(() => {
    const count = Math.min(candles.length, 60)
    setViewStart(Math.max(0, candles.length - count))
    setViewCount(count)
  }, [candles.length])

  // ─── Unified wheel/trackpad handler ───
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // ctrlKey is set by trackpad pinch gestures in most browsers
    if (e.ctrlKey) {
      // Pinch zoom
      const delta = e.deltaY > 0 ? 3 : -3
      setViewCount(prev => {
        const next = Math.max(10, Math.min(candles.length, prev + delta))
        setViewStart(vs => Math.max(0, Math.min(candles.length - next, vs - Math.round(delta / 2))))
        return next
      })
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Horizontal two-finger swipe → pan
      const sensitivity = 0.15
      const shift = Math.round(e.deltaX * sensitivity)
      if (shift !== 0) {
        setViewStart(prev => Math.max(0, Math.min(candles.length - viewCount, prev + shift)))
      }
    } else {
      // Vertical scroll → zoom
      const delta = e.deltaY > 0 ? 4 : -4
      setViewCount(prev => {
        const next = Math.max(10, Math.min(candles.length, prev + delta))
        setViewStart(vs => Math.max(0, Math.min(candles.length - next, vs - Math.round(delta / 2))))
        return next
      })
    }
  }, [candles.length, viewCount])

  // ─── Touch handlers for mobile pinch/pan ───
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
      lastTouchX.current = (e.touches[0].clientX + e.touches[1].clientX) / 2
    } else if (e.touches.length === 1) {
      lastTouchX.current = e.touches[0].clientX
      setIsDragging(true)
      setDragStartX(e.touches[0].clientX)
      setDragStartView(viewStart)
    }
  }, [viewStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const chartW = rect.width - 56

    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      // Pinch zoom
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const diff = dist - lastTouchDist.current

      if (Math.abs(diff) > 5) {
        const delta = diff > 0 ? -3 : 3
        setViewCount(prev => {
          const next = Math.max(10, Math.min(candles.length, prev + delta))
          setViewStart(vs => Math.max(0, Math.min(candles.length - next, vs)))
          return next
        })
        lastTouchDist.current = dist
      }

      // Also pan with two-finger move
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      if (lastTouchX.current !== null) {
        const panDx = midX - lastTouchX.current
        const candlesPerPx = viewCount / chartW
        const shift = Math.round(panDx * candlesPerPx * -1)
        if (shift !== 0) {
          setViewStart(prev => Math.max(0, Math.min(candles.length - viewCount, prev + shift)))
        }
      }
      lastTouchX.current = midX
    } else if (e.touches.length === 1 && isDragging) {
      // Single finger pan
      const dx = e.touches[0].clientX - dragStartX
      const candlesPerPx = viewCount / chartW
      const shift = Math.round(dx * candlesPerPx * -1)
      setViewStart(Math.max(0, Math.min(candles.length - viewCount, dragStartView + shift)))
    }
  }, [isDragging, dragStartX, dragStartView, viewCount, candles.length])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    lastTouchDist.current = null
    lastTouchX.current = null
  }, [])

  // Mouse pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (drawMode) return
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartView(viewStart)
  }, [drawMode, viewStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const chartW = rect.width - 56

    if (isDragging && !drawMode) {
      const dx = e.clientX - dragStartX
      const candlesPerPx = viewCount / chartW
      const shift = Math.round(dx * candlesPerPx * -1)
      setViewStart(Math.max(0, Math.min(candles.length - viewCount, dragStartView + shift)))
    }

    const x = e.clientX - rect.left
    if (x >= 0 && x <= chartW && viewCount > 0) {
      const gap2 = chartW / viewCount
      setHoverCandle(Math.min(Math.floor(x / gap2), viewCount - 1))
    } else {
      setHoverCandle(null)
    }
  }, [isDragging, drawMode, dragStartX, dragStartView, viewCount, candles.length])

  const handleMouseUp = useCallback(() => { setIsDragging(false) }, [])

  // S&R drawing
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!drawMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const PAD_TOP = 4
    const VOL_H = Math.round(rect.height * 0.14)
    const TIME_H = 20
    const MACD_H = indicators.macd ? Math.round(rect.height * 0.15) : 0
    const CANDLE_BOT = rect.height - VOL_H - 6 - TIME_H - (MACD_H > 0 ? MACD_H + 4 : 0)
    const chartH = CANDLE_BOT - PAD_TOP

    const visible = candles.slice(viewStart, viewStart + viewCount)
    const prices = visible.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 1

    const mouseY = e.clientY - rect.top
    const price = maxP - ((mouseY - PAD_TOP) / chartH) * range

    if (price >= minP && price <= maxP) {
      setDrawings(prev => [...prev, { id: Date.now().toString(), y: Math.round(price * 100) / 100 }])
    }
  }, [drawMode, candles, viewStart, viewCount, indicators.macd])

  // Attach listeners
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    wrap.addEventListener('wheel', handleWheel, { passive: false })
    wrap.addEventListener('touchstart', handleTouchStart, { passive: false })
    wrap.addEventListener('touchmove', handleTouchMove, { passive: false })
    wrap.addEventListener('touchend', handleTouchEnd)
    return () => {
      wrap.removeEventListener('wheel', handleWheel)
      wrap.removeEventListener('touchstart', handleTouchStart)
      wrap.removeEventListener('touchmove', handleTouchMove)
      wrap.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd])

  // ─── RENDER ───
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || candles.length === 0 || viewCount === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width; const H = rect.height
    const PAD_TOP = 4; const PAD_RIGHT = 56
    const VOL_H = Math.round(H * 0.14); const TIME_H = 20
    const MACD_H = indicators.macd ? Math.round(H * 0.15) : 0
    const CANDLE_BOT = H - VOL_H - 6 - TIME_H - (MACD_H > 0 ? MACD_H + 4 : 0)
    const chartH = CANDLE_BOT - PAD_TOP

    ctx.clearRect(0, 0, W, H)

    const visible = candles.slice(viewStart, viewStart + viewCount)
    const allCloses = candles.map(c => c.close)
    const prices = visible.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices); const maxP = Math.max(...prices)
    const range = maxP - minP || 1
    const maxVol = Math.max(...visible.map(c => c.volume), 1)
    const chartW = W - PAD_RIGHT
    const candleW = Math.max(3, (chartW / viewCount) * 0.7)
    const gap = chartW / viewCount

    const yPos = (price: number): number => PAD_TOP + chartH - ((price - minP) / range) * chartH

    const green = '#30d158'; const red = '#ff453a'

    // Grid
    ctx.font = '12px DM Mono, monospace'; ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const price = minP + (range / 5) * i
      const y = yPos(price)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillText(price >= 100 ? price.toFixed(2) : price.toFixed(3), W - 4, y + 4)
    }

    // Time labels — dates for Daily, times for intraday
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px DM Mono, monospace'
    const timeLabelY = H - 6
    const li = Math.max(1, Math.floor(viewCount / 5))
    for (let i = 0; i < viewCount; i += li) {
      const x = i * gap + gap / 2
      const date = new Date(visible[i].time)
      ctx.fillText(formatTimeLabel(date, label), x, timeLabelY)
    }

    // Candles
    for (let i = 0; i < viewCount; i++) {
      const c = visible[i]; const x = i * gap + gap / 2; const isUp = c.close >= c.open; const color = isUp ? green : red
      ctx.strokeStyle = color; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(x, yPos(c.high)); ctx.lineTo(x, yPos(c.low)); ctx.stroke()
      const bt = yPos(Math.max(c.open, c.close)); const bb = yPos(Math.min(c.open, c.close))
      ctx.fillStyle = color; ctx.fillRect(x - candleW / 2, bt, candleW, Math.max(2, bb - bt))
    }

    // EMAs
    const emaKeys = ['ema9', 'ema20', 'ema50', 'ema100', 'ema200'] as const
    const emaPeriods = { ema9: 9, ema20: 20, ema50: 50, ema100: 100, ema200: 200 }
    emaKeys.forEach(key => {
      if (!indicators[key]) return
      const ema = calcEMA(allCloses, emaPeriods[key])
      const sliced = ema.slice(viewStart, viewStart + viewCount)
      ctx.strokeStyle = EMA_COLORS[key]; ctx.lineWidth = 1.2; ctx.beginPath()
      let started = false
      for (let i = 0; i < viewCount; i++) { const v = sliced[i]; if (v === null) continue; const x = i * gap + gap / 2; const y = yPos(v); if (!started) { ctx.moveTo(x, y); started = true } else { ctx.lineTo(x, y) } }
      ctx.stroke()
    })

    // VWAP
    if (indicators.vwap) {
      const vwap = calcVWAP(candles); const sliced = vwap.slice(viewStart, viewStart + viewCount)
      ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 2]); ctx.beginPath()
      let started = false
      for (let i = 0; i < viewCount; i++) { const v = sliced[i]; if (v === null) continue; const x = i * gap + gap / 2; const y = yPos(v); if (!started) { ctx.moveTo(x, y); started = true } else { ctx.lineTo(x, y) } }
      ctx.stroke(); ctx.setLineDash([])
    }

    // S&R lines
    drawings.forEach(d => {
      if (d.y < minP || d.y > maxP) return; const y = yPos(d.y)
      ctx.strokeStyle = 'rgba(255,214,10,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([6, 3])
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,214,10,0.8)'; ctx.font = '10px DM Mono, monospace'; ctx.textAlign = 'left'
      ctx.fillText(`S/R ${d.y.toFixed(2)}`, 4, y - 4)
    })

    // Volume
    const volTop = CANDLE_BOT + 6
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(0, volTop - 2); ctx.lineTo(chartW, volTop - 2); ctx.stroke()
    for (let i = 0; i < viewCount; i++) {
      const c = visible[i]; const x = i * gap + gap / 2; const barH = Math.max(1, (c.volume / maxVol) * VOL_H)
      ctx.fillStyle = c.close >= c.open ? 'rgba(48,209,88,0.25)' : 'rgba(255,69,58,0.25)'
      ctx.fillRect(x - candleW / 2, volTop + VOL_H - barH, candleW, barH)
    }

    // MACD
    if (indicators.macd) {
      const macdData = calcMACD(allCloses)
      const macdSlice = macdData.macd.slice(viewStart, viewStart + viewCount)
      const sigSlice = macdData.signal.slice(viewStart, viewStart + viewCount)
      const histSlice = macdData.histogram.slice(viewStart, viewStart + viewCount)
      const macdTop = volTop + VOL_H + 4
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(0, macdTop); ctx.lineTo(chartW, macdTop); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '10px DM Mono, monospace'; ctx.textAlign = 'right'
      ctx.fillText('MACD', W - 4, macdTop + 10)
      const allM = [...macdSlice, ...sigSlice, ...histSlice].filter(v => v !== null) as number[]
      if (allM.length > 0) {
        const macdMax = Math.max(...allM.map(Math.abs), 0.01)
        const macdY = (val: number): number => macdTop + MACD_H / 2 - (val / macdMax) * (MACD_H / 2 - 4)
        const zY = macdY(0)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(0, zY); ctx.lineTo(chartW, zY); ctx.stroke()
        for (let i = 0; i < viewCount; i++) { const h = histSlice[i]; if (h === null) continue; const x = i * gap + gap / 2; const y = macdY(h); ctx.fillStyle = h >= 0 ? 'rgba(48,209,88,0.35)' : 'rgba(255,69,58,0.35)'; ctx.fillRect(x - candleW / 3, Math.min(y, zY), candleW * 0.66, Math.abs(y - zY)) }
        ctx.strokeStyle = '#2997ff'; ctx.lineWidth = 1.2; ctx.beginPath(); let s1 = false
        for (let i = 0; i < viewCount; i++) { const v = macdSlice[i]; if (v === null) continue; const x = i * gap + gap / 2; if (!s1) { ctx.moveTo(x, macdY(v)); s1 = true } else ctx.lineTo(x, macdY(v)) }; ctx.stroke()
        ctx.strokeStyle = '#ff9500'; ctx.lineWidth = 1; ctx.beginPath(); let s2 = false
        for (let i = 0; i < viewCount; i++) { const v = sigSlice[i]; if (v === null) continue; const x = i * gap + gap / 2; if (!s2) { ctx.moveTo(x, macdY(v)); s2 = true } else ctx.lineTo(x, macdY(v)) }; ctx.stroke()
      }
    }

    // Crosshair
    if (hoverCandle !== null && hoverCandle < viewCount) {
      const x = hoverCandle * gap + gap / 2
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5; ctx.setLineDash([2, 2])
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - TIME_H); ctx.stroke(); ctx.setLineDash([])
    }

    // Price line + badge
    const lastC = visible[viewCount - 1]; const ly = yPos(lastC.close)
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(41,151,255,0.5)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(chartW, ly); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#2997ff'; ctx.beginPath(); ctx.roundRect(chartW + 1, ly - 11, 54, 22, 4); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '600 11px DM Mono, monospace'
    ctx.fillText(lastC.close.toFixed(2), chartW + 28, ly + 4)
  }, [candles, viewStart, viewCount, indicators, drawings, hoverCandle, label])

  const last = candles.length > 0 ? candles[Math.min(viewStart + (hoverCandle ?? viewCount - 1), candles.length - 1)] : null

  return (
    <div className={styles.chartView}>
      <div className={styles.chartHeader}>
        <div className={styles.chartLabel}>
          <span className={styles.chartSym}>{symbol}</span>
          <span className={styles.chartTf}>{label}</span>
        </div>
        {last && (
          <div className={styles.ohlcv}>
            <span>O <b>{last.open.toFixed(2)}</b></span>
            <span>H <b>{last.high.toFixed(2)}</b></span>
            <span>L <b>{last.low.toFixed(2)}</b></span>
            <span>C <b className={last.close >= last.open ? styles.ohlcGreen : styles.ohlcRed}>{last.close.toFixed(2)}</b></span>
            <span>V <b>{formatCompact(last.volume)}</b></span>
          </div>
        )}
        <div className={styles.chartActions}>
          <button className={`${styles.drawBtn} ${drawMode ? styles.drawActive : ''}`} onClick={() => setDrawMode(!drawMode)} title="Draw S/R lines">S/R</button>
          {drawings.length > 0 && <button className={styles.clearBtn} onClick={() => setDrawings([])} title="Clear">Clear</button>}
          <button className={styles.expandBtn} onClick={onExpand} title="Expand chart">⛶</button>
        </div>
      </div>
      <div
        ref={wrapRef}
        className={`${styles.canvasWrap} ${drawMode ? styles.drawCursor : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsDragging(false); setHoverCandle(null) }}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}

// ─── Modal ───
interface ModalProps {
  candles: Candle[]; label: string; symbol: string; indicators: IndicatorState; onClose: () => void
}

function ChartModal({ candles, label, symbol, indicators, onClose }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{symbol} — {label}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalChart}>
          <ChartView candles={candles} label={label} symbol={symbol} indicators={indicators} onExpand={onClose} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Panel ───
interface Props { symbol: string | null; candleData: Record<ChartTimeframe, Candle[]> | null }

export default function ChartPanel({ symbol, candleData }: Props) {
  const [indicators, setIndicators] = useState<IndicatorState>({
    ema9: true, ema20: true, ema50: false, ema100: false, ema200: false, vwap: true, macd: false,
  })
  const [expandedChart, setExpandedChart] = useState<{ candles: Candle[]; label: string } | null>(null)

  function toggle(key: keyof IndicatorState) { setIndicators(prev => ({ ...prev, [key]: !prev[key] })) }

  if (!symbol || !candleData) {
    return (
      <div className={styles.panel}>
        <div className={styles.placeholderGrid}>
          {['1 Min', '5 Min', 'Daily'].map(tf => (
            <div key={tf} className={styles.placeholder}>
              <div className={styles.phTf}>{tf}</div>
              <div className={styles.phText}>Click a ticker above to load chart details</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const charts: { key: ChartTimeframe; label: string }[] = [
    { key: '1m', label: '1 Min' }, { key: '5m', label: '5 Min' }, { key: '1D', label: 'Daily' },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <span className={styles.toolLabel}>Indicators</span>
        {([
          ['ema9', 'EMA 9', '#ffcc00'], ['ema20', 'EMA 20', '#ff9500'], ['ema50', 'EMA 50', '#af52de'],
          ['ema100', 'EMA 100', '#5ac8fa'], ['ema200', 'EMA 200', '#ff375f'],
          ['vwap', 'VWAP', '#00bcd4'], ['macd', 'MACD', '#2997ff'],
        ] as [keyof IndicatorState, string, string][]).map(([key, name, color]) => (
          <button key={key} className={`${styles.indBtn} ${indicators[key] ? styles.indActive : ''}`}
            style={indicators[key] ? { borderColor: color, color } : undefined} onClick={() => toggle(key)}>{name}</button>
        ))}
        <span className={styles.toolHint}>Scroll/pinch to zoom · Swipe to pan</span>
      </div>

      <div className={styles.chartGrid}>
        {charts.map(c => (
          <ChartView
            key={c.key}
            candles={candleData[c.key]}
            label={c.label}
            symbol={symbol}
            indicators={indicators}
            onExpand={() => setExpandedChart({ candles: candleData[c.key], label: c.label })}
          />
        ))}
      </div>

      {expandedChart && (
        <ChartModal
          candles={expandedChart.candles}
          label={expandedChart.label}
          symbol={symbol}
          indicators={indicators}
          onClose={() => setExpandedChart(null)}
        />
      )}
    </div>
  )
}
