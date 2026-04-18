'use client'

import { useRef, useEffect } from 'react'
import { Candle, ChartTimeframe } from '@/lib/types'
import { formatUSD, formatCompact } from '@/lib/utils'
import styles from './ChartPanel.module.css'

interface ChartViewProps {
  candles: Candle[]
  label: string
  symbol: string
}

function ChartView({ candles, label, symbol }: ChartViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || candles.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const PAD_TOP = 4
    const PAD_RIGHT = 56
    const VOL_H = Math.round(H * 0.16)
    const TIME_H = 20
    const CANDLE_BOT = H - VOL_H - 6 - TIME_H
    const chartH = CANDLE_BOT - PAD_TOP

    ctx.clearRect(0, 0, W, H)

    const prices = candles.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 1
    const maxVol = Math.max(...candles.map(c => c.volume), 1)

    const chartW = W - PAD_RIGHT
    // Wider candles for legibility — 70% of slot width
    const candleW = Math.max(3, (chartW / candles.length) * 0.7)
    const gap = chartW / candles.length

    function yPos(price: number): number {
      return PAD_TOP + chartH - ((price - minP) / range) * chartH
    }

    const green = '#30d158'
    const red = '#ff453a'

    // Grid — more visible lines
    ctx.font = '12px DM Mono, monospace'
    ctx.textAlign = 'right'
    const gridSteps = 5
    for (let i = 0; i <= gridSteps; i++) {
      const price = minP + (range / gridSteps) * i
      const y = yPos(price)

      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillText(price >= 100 ? price.toFixed(2) : price.toFixed(3), W - 4, y + 4)
    }

    // Time labels
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '11px DM Mono, monospace'
    const timeLabelY = CANDLE_BOT + 6 + VOL_H + 14
    const labelInterval = Math.max(1, Math.floor(candles.length / 5))
    for (let i = 0; i < candles.length; i += labelInterval) {
      const x = i * gap + gap / 2
      const date = new Date(candles[i].time)
      const label2 = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      ctx.fillText(label2, x, timeLabelY)
    }

    // Candles — thicker wicks for legibility
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const x = i * gap + gap / 2
      const isUp = c.close >= c.open
      const color = isUp ? green : red

      // Wick — 1.5px for visibility
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(x, yPos(c.high)); ctx.lineTo(x, yPos(c.low)); ctx.stroke()

      // Body
      const bodyTop = yPos(Math.max(c.open, c.close))
      const bodyBot = yPos(Math.min(c.open, c.close))
      const bodyH = Math.max(2, bodyBot - bodyTop)
      ctx.fillStyle = color
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH)
    }

    // Volume bars
    const volTop = CANDLE_BOT + 6
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(0, volTop - 2); ctx.lineTo(chartW, volTop - 2); ctx.stroke()

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const x = i * gap + gap / 2
      const barH = Math.max(1, (c.volume / maxVol) * VOL_H)
      ctx.fillStyle = c.close >= c.open ? 'rgba(48,209,88,0.25)' : 'rgba(255,69,58,0.25)'
      ctx.fillRect(x - candleW / 2, volTop + VOL_H - barH, candleW, barH)
    }

    // Current price line
    const last = candles[candles.length - 1]
    const ly = yPos(last.close)
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = 'rgba(41,151,255,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(chartW, ly); ctx.stroke()
    ctx.setLineDash([])

    // Price badge
    const badgeW = 54
    const badgeH = 22
    const badgeX = chartW + 1
    const badgeY = ly - badgeH / 2
    ctx.fillStyle = '#2997ff'
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.font = '600 11px DM Mono, monospace'
    ctx.fillText(last.close.toFixed(2), badgeX + badgeW / 2, ly + 4)

  }, [candles])

  // OHLCV summary from last candle
  const last = candles.length > 0 ? candles[candles.length - 1] : null

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
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}

interface Props {
  symbol: string | null
  candleData: Record<ChartTimeframe, Candle[]> | null
}

export default function ChartPanel({ symbol, candleData }: Props) {
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

  return (
    <div className={styles.panel}>
      <div className={styles.chartGrid}>
        <ChartView candles={candleData['1m']} label="1 Min" symbol={symbol} />
        <ChartView candles={candleData['5m']} label="5 Min" symbol={symbol} />
        <ChartView candles={candleData['1D']} label="Daily" symbol={symbol} />
      </div>
    </div>
  )
}
